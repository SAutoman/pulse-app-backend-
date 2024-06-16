import { Request, Response, NextFunction } from 'express';
import prisma from '../helpers/prisma-client';
import { ICustomRequest } from '../types/custom-types';

interface ICreateRewardRequest extends Request {
  body: {
    name: string;
    description: string;
    points_cost: number;
    quantity: number;
    is_active: boolean;
    available_from: string;
    available_until: string;
    image_url: string;
    badge_requirements: string[];
    max_redemptions_per_user?: number;
    is_public: boolean;
    club_ids?: string[];
  };
}

// Create a Reward
const createReward = async (
  req: ICreateRewardRequest,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    description,
    points_cost,
    quantity,
    is_active,
    available_from,
    available_until,
    image_url,
    badge_requirements,
    max_redemptions_per_user,
    is_public,
    club_ids,
  } = req.body;
  try {
    // Validate badge IDs
    const badges = await prisma.badge.findMany({
      where: {
        id: { in: badge_requirements },
      },
    });

    if (badge_requirements && badges.length !== badge_requirements.length) {
      return res
        .status(400)
        .json({ message: 'One or more badge IDs are invalid.' });
    }

    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        points_cost,
        quantity,
        is_active,
        available_from,
        available_until,
        image_url,
        badge_requirements,
        max_redemptions_per_user,
        is_public,
      },
    });

    // Handle non-public rewards and their club associations
    if (!is_public && club_ids && club_ids.length > 0) {
      await Promise.all(
        club_ids.map((club_id) =>
          prisma.rewardClub.create({
            data: {
              reward_id: reward.id,
              club_id: club_id,
            },
          })
        )
      );
    }
    res.status(201).json({ reward });
  } catch (error) {
    next(error);
  }
};

// Get all Rewards
const getAllRewards = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as ICustomRequest).authenticatedUser.id; // Assumed to be set from JWT middleware

  try {
    // Fetch club IDs associated with the user
    const userClubs = await prisma.userClub.findMany({
      where: { user_id: userId },
      select: { club_id: true },
    });
    const clubIds = userClubs.map((club) => club.club_id);

    // Fetch rewards that are public or associated with the user's clubs
    const rewards = await prisma.reward.findMany({
      where: {
        OR: [
          { is_public: true },
          { reward_clubs: { some: { club_id: { in: clubIds } } } },
        ],
      },
      include: {
        reward_clubs: {
          include: {
            club: true,
          },
        }, // Include club details if needed
      },
    });

    res.status(200).json({ rewards });
  } catch (error) {
    console.error('Failed to fetch rewards:', error);
    next(error);
  }
};

// Get Reward by ID
const getRewardById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const reward = await prisma.reward.findUnique({
      where: { id },
      include: {
        reward_clubs: {
          include: {
            club: true,
          },
        }, // Include club details if needed
      },
    });
    reward
      ? res.status(200).json({ reward })
      : res.status(404).send('Reward not found');
  } catch (error) {
    next(error);
  }
};

// Update a Reward
const updateReward = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const {
    name,
    description,
    points_cost,
    quantity,
    is_active,
    available_from,
    available_until,
    image_url,
    max_redemptions_per_user,
  } = req.body;
  try {
    const reward = await prisma.reward.update({
      where: { id },
      data: {
        name,
        description,
        points_cost,
        quantity,
        is_active,
        available_from,
        available_until,
        image_url,
        max_redemptions_per_user,
      },
      include: {
        reward_clubs: {
          include: {
            club: true,
          },
        }, // Include club details if needed
      },
    });
    res.status(200).json({ reward });
  } catch (error) {
    next(error);
  }
};

// Delete a Reward
const deleteReward = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    await prisma.reward.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Function to get redeemed rewards for a user
const getRedeemedRewardsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;

  try {
    const redeemedRewards = await prisma.userReward.findMany({
      where: {
        user_id: userId,
      },
      include: {
        reward: {
          include: {
            reward_clubs: {
              include: {
                club: true,
              },
            }, // Include club details if needed
          },
        }, // Assuming you have a relation named 'reward' in your Prisma schema
      },
      orderBy: {
        redeemed_at: 'desc',
      },
    });

    res.status(200).json({ redeemedRewards });
  } catch (error) {
    console.error('Failed to fetch redeemed rewards:', error);
    next(error);
  }
};

export {
  createReward,
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward,
  getRedeemedRewardsByUser,
};
