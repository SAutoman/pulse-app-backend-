import { Request, Response, NextFunction } from 'express';
import prisma from '../helpers/prisma-client';
import { DateTime } from 'luxon';

//C - Create a relation between an user and a club
export const createUserClub = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user_id, club_id } = req.body;

  try {
    // Check if the association already exists
    const existingAssociation = await prisma.userClub.findFirst({
      where: {
        user_id: user_id,
        club_id: club_id,
      },
    });

    if (existingAssociation) {
      return res
        .status(400)
        .json({ message: 'This UserClub association already exists.' });
    }

    const userClub = await prisma.userClub.create({
      data: {
        user_id,
        club_id,
        created_at: DateTime.utc().toISO()!,
      },
    });
    res.status(201).json({ userClub });
  } catch (error) {
    next(error);
  }
};

//R - Get all user clubs (relations between users and clubs)
export const getUserClubs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userClubs = await prisma.userClub.findMany();
    res.status(200).json({ userClubs });
  } catch (error) {
    next(error);
  }
};

//R - Get Club by ID
export const getUserClubById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const userClub = await prisma.userClub.findUnique({
      where: { id },
    });
    if (userClub) {
      res.status(200).json({ userClub });
    } else {
      res.status(404).json({ msg: 'UserClub not found' });
    }
  } catch (error) {
    next(error);
  }
};

export const getClubsForUserId = async (req: Request, res: Response) => {
  const { userId } = req.params;

  //Validate if user exists
  const userFound = await prisma.user.findFirst({ where: { id: userId } });

  if (!userFound) {
    return res
      .status(400)
      .json({ msg: 'User with ID was not found in the database' });
  }

  const clubs = await prisma.userClub.findMany({
    where: { user_id: userId },
    include: { club: true },
  });

  return res.status(200).json({ quantity: clubs.length, clubs });
};

//U - Update user club (not used - the item should be deleted and created again)
export const updateUserClub = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { user_id, club_id } = req.body;
  try {
    const userClub = await prisma.userClub.update({
      where: { id },
      data: {
        user_id,
        club_id,
      },
    });
    res.status(200).json({ userClub });
  } catch (error) {
    next(error);
  }
};

//D - Dekete an user-club relation
export const deleteUserClub = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const deletedUserClub = await prisma.userClub.delete({
      where: { id },
    });
    res.status(200).json({ deletedUserClub });
  } catch (error) {
    next(error);
  }
};

//D - Dekete an user-club relation by user ID and Club ID
export const deleteUserClubByUserIdClubId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { club_id, user_id } = req.query;
  try {
    const userClubToDelete = await prisma.userClub.findFirst({
      where: { user_id: user_id as string, club_id: club_id as string },
    });

    if (userClubToDelete) {
      const deletedUserClub = await prisma.userClub.delete({
        where: { id: userClubToDelete.id },
      });
      return res.status(200).json({ deletedUserClub });
    } else {
      return res.status(404).json({
        msg: `There is no userClub relation with the club: ${club_id} and user: ${user_id} provided.`,
      });
    }
  } catch (error) {
    next(error);
  }
};
