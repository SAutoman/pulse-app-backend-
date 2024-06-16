import { Request, Response, NextFunction } from 'express';
import prisma from '../helpers/prisma-client';

// Redeem a Reward
export const redeemReward = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user_id, reward_id } = req.body;
  try {
    // Fetch reward details, user details, and check for existing redemption
    const [reward, user, userRedemptions, rewardClubs] = await Promise.all([
      prisma.reward.findUnique({
        where: { id: reward_id },
        include: { reward_clubs: true },
      }),
      prisma.user.findUnique({
        where: { id: user_id },
      }),
      prisma.userReward.count({
        where: {
          user_id,
          reward_id,
        },
      }),
      prisma.rewardClub.findMany({
        where: { reward_id },
        select: { club_id: true },
      }),
    ]);

    // Check if reward exists and is in stock
    if (!reward || reward.quantity <= 0) {
      return res
        .status(404)
        .json({ message: 'Reward not available or out of stock.' });
    }

    // Check if user exists and has enough coins
    if (!user || user.coins < reward.points_cost) {
      return res
        .status(400)
        .json({ message: 'Insufficient coins to redeem this reward.' });
    }

    // Check if the user has already redeemed this reward
    if (
      reward.max_redemptions_per_user != null &&
      userRedemptions >= reward.max_redemptions_per_user
    ) {
      return res.status(400).json({
        message:
          'You have reached the maximum redemption limit for this reward.',
      });
    }

    // Check if user meets the badge requirements
    if (reward.badge_requirements && reward.badge_requirements.length) {
      const userBadges = await prisma.userBadge.findMany({
        where: { user_id },
        select: { badge_id: true },
      });
      const userBadgeIds = userBadges.map((ub) => ub.badge_id);

      const hasAllRequiredBadges = reward.badge_requirements.every((badgeId) =>
        userBadgeIds.includes(badgeId)
      );
      if (!hasAllRequiredBadges) {
        return res.status(403).json({
          message:
            'User does not meet the badge requirements to redeem this reward.',
        });
      }
    }

    // Check club membership if the reward is not public
    if (!reward.is_public) {
      const userClubs = await prisma.userClub.findMany({
        where: { user_id },
        select: { club_id: true },
      });
      const userClubIds = userClubs.map((uc) => uc.club_id);
      const isMember = rewardClubs.some((rc) =>
        userClubIds.includes(rc.club_id)
      );

      if (!isMember) {
        return res.status(403).json({
          message:
            'User is not a member of any clubs associated with this reward.',
        });
      }
    }

    // Transaction to redeem the reward, update user coins, and log the redemption
    const transactionResponse = await prisma.$transaction([
      prisma.reward.update({
        where: { id: reward_id },
        data: { quantity: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: user_id },
        data: { coins: { decrement: reward.points_cost } },
      }),
      prisma.userReward.create({
        data: {
          user_id,
          reward_id,
          redeemed_at: new Date().toISOString(),
        },
      }),
      prisma.coinTransaction.create({
        data: {
          user_id,
          amount: reward.points_cost * -1,
          type: 'REWARD_REDEMPTION',
          description: `Redeemed Reward ${reward.name} (id: ${reward.id})`,
          created_at_epoch_ms: new Date().getTime().toString(),
        },
      }),
    ]);

    const updatedReward = transactionResponse[0];
    const updatedUser = transactionResponse[1];
    const newUserReward = transactionResponse[2];
    const newCoinTransaction = transactionResponse[3];

    res.status(200).json({
      message: 'Reward redeemed successfully.',
      userReward: newUserReward,
      updatedUser,
      updatedReward,
      newCoinTransaction,
    });
  } catch (error) {
    next(error);
  }
};
