import { Request, Response, NextFunction } from 'express';
import prisma from '../helpers/prisma-client';
import { Prisma } from '@prisma/client';

// Create a UserBadge
const createUserBadge = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user_id, badge_id } = req.body;
  try {
    const userBadge = await prisma.userBadge.create({
      data: {
        user_id,
        badge_id,
        date_earned_epoch_ms: new Date().getTime().toString(),
      },
    });
    res.status(201).json(userBadge);
  } catch (error) {
    next(error);
  }
};

// Get all UserBadges
const getAllUserBadges = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userBadges = await prisma.userBadge.findMany({
      include: {
        user: true,
        badge: true,
      },
    });
    res.status(200).json(userBadges);
  } catch (error) {
    next(error);
  }
};

// Get a single UserBadge by ID
const getUserBadgeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const userBadge = await prisma.userBadge.findUnique({
      where: { id },
      include: {
        user: true,
        badge: true,
      },
    });
    if (!userBadge) {
      return res.status(404).json({ message: 'UserBadge not found' });
    }
    res.status(200).json(userBadge);
  } catch (error) {
    next(error);
  }
};

// Update a UserBadge
const updateUserBadge = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { badge_id } = req.body;
  try {
    const userBadge = await prisma.userBadge.update({
      where: { id },
      data: { badge_id },
    });
    res.status(200).json(userBadge);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({ message: 'UserBadge not found' });
    }
    next(error);
  }
};

// Delete a UserBadge
const deleteUserBadge = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    await prisma.userBadge.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({ message: 'UserBadge not found' });
    }
    next(error);
  }
};

const getUserBadges = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params; // Extract user ID from the request parameters

  try {
    const userBadges = await prisma.userBadge.findMany({
      where: {
        user_id: userId,
      },
      include: {
        badge: true, // Assuming there is a relation setup to include details of the badge
      },
    });

    if (!userBadges) {
      return res
        .status(404)
        .json({ message: 'No badges found for this user.' });
    }

    res.status(200).json({ count: userBadges.length, userBadges });
  } catch (error) {
    console.error('Failed to fetch user badges:', error);
    next(error);
  }
};

export {
  createUserBadge,
  getAllUserBadges,
  getUserBadgeById,
  deleteUserBadge,
  getUserBadges,
};
