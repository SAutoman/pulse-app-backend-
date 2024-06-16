import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';
import { retrieveUsersRanking } from '../helpers/ranking-helpers/retrieve-users-ranking';

const getUsersRankingByWeek = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { rankingLeagueId } = req.query;

  if (!rankingLeagueId) {
    return res
      .status(401)
      .json({ message: 'The rankingLeagueID is required.' });
  }

  try {
    const userList = await retrieveUsersRanking(rankingLeagueId!.toString());

    res.status(200).json({
      msg: 'Ranking OK',
      userCount: userList.length,
      userList,
    });
  } catch (error) {
    next(error);
  }
};

//Get all Users
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        email: 'asc',
      },
      include: {
        sport_type: true,
        user_clubs: {
          include: {
            club: {
              include: {
                sport_type: true,
              },
            },
          },
        },
        current_league: {
          include: { category: true },
        },
        user_badges: {
          include: { badge: true },
        },
      },
    });
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

//Get user by ID
const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId } = req.params;
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        sport_type: true,
        user_clubs: {
          include: {
            club: {
              include: {
                sport_type: true,
              },
            },
          },
        },
        current_league: {
          include: { category: true },
        },
        user_badges: {
          include: { badge: true },
        },
      },
    });
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

//Update user by ID
const updateUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.params;
  const {
    created_at,
    strava_connected,
    strava_access_token,
    strava_access_expires_at,
    strava_user_id,
    weekly_scores,
    current_week_score,
    ...payload
  } = req.body;

  try {
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...payload,
      },
      include: {
        sport_type: true,
        user_clubs: {
          include: {
            club: {
              include: {
                sport_type: true,
              },
            },
          },
        },
        current_league: {
          include: { category: true },
        },
        user_badges: {
          include: { badge: true },
        },
      },
    });
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

//Inactivate user by ID
const inactivateUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.params;

  try {
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        is_active: false,
      },
    });
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

//Delete user by ID
const deleteUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.params;

  try {
    //Delete the activities and notifications from the user
    const deletedActivities = await prisma.activity.deleteMany({
      where: { userId },
    });
    const deletedNotifications = await prisma.userNotifications.deleteMany({
      where: { userId },
    });
    //Delete the user
    const user = await prisma.user.delete({
      where: {
        id: userId,
      },
    });
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

//Testing
const testingEndpoint = (req: Request, res: Response, next: NextFunction) => {
  next(new Error('Error not handled yet!!'));
};

//Exports
export {
  getUsersRankingByWeek,
  getAllUsers,
  getUserById,
  updateUserById,
  testingEndpoint,
  deleteUserById,
};
