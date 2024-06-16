import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';
import { DateTime } from 'luxon';
import { ICustomRequest } from '../types/custom-types';
import { User } from '@prisma/client';
import { DEBUG_MODE } from '../main';
import {
  convertYearWeekToDates,
  convertYearWeekToEpochRange,
} from '../helpers/dates-helper';
import {
  reCalculateActivitiesPoints,
  calculatePoints,
} from '../helpers/points-calculator';

//Get all activities
const getAllActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { year = 1999, week = 99 } = req.query;

  const user: User = (req as ICustomRequest).authenticatedUser;

  let startEpoch: number | null = null;
  let endEpoch: number | null = null;

  // If year and week are specified and valid
  if (year !== 1999 && week !== 99) {
    const startOfWeek = DateTime.fromObject(
      {
        weekYear: parseInt(year as string),
        weekNumber: parseInt(week as string),
        weekday: 1,
      },
      { zone: 'UTC' }
    ).startOf('week');
    const endOfWeek = startOfWeek.endOf('week');

    startEpoch = startOfWeek.toMillis();
    endEpoch = endOfWeek.toMillis();
  } else {
    // If year and week are not specified, or are default values
    // You may choose to fetch all activities or define a default behavior
    // For example, setting a very wide range to include all activities
    startEpoch = DateTime.fromISO('1970-01-01T00:00:00.000Z').toMillis(); // Very start of epoch
    endEpoch = DateTime.local().plus({ years: 100 }).toMillis(); // Plus 100 years from now
  }

  try {
    const activities = await prisma.activity.findMany({
      where: {
        // Use the epoch milliseconds for filtering
        created_at_epoch_ms: {
          gte: startEpoch.toString(),
          lt: endEpoch.toString(),
        },
        // Add any other filters here
      },
      orderBy: {
        created_at_epoch_ms: 'asc', // Adjust as needed
      },
    });

    res.status(200).json({ count: activities.length, activities });
  } catch (error) {
    next(error);
  }
};

// Get activities by user ID
const getActivitiesByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.params;
  const { year = 1999, week = 99, fromEpoch, toEpoch } = req.query;

  // You can request data either by week or a range of dates, not both.
  if (
    (year !== 1999 || week !== 99) &&
    (fromEpoch !== undefined || toEpoch !== undefined)
  ) {
    return res.status(400).json({
      error:
        'You can request data either by week or a range of dates, not both.',
    });
  }

  // Get the current user authenticated
  const user: User = (req as ICustomRequest).authenticatedUser;

  // Get current user timezone
  const userTimezone = user.timezone.substring(12);

  let startEpoch: number | null = null;
  let endEpoch: number | null = null;

  // If requesting by epoch milliseconds
  if (fromEpoch !== undefined && toEpoch !== undefined) {
    const fromEpochNumber = parseInt(fromEpoch as string);
    const toEpochNumber = parseInt(toEpoch as string);

    if (isNaN(fromEpochNumber) || isNaN(toEpochNumber)) {
      return res.status(400).json({
        error: 'fromEpoch and toEpoch must be valid numbers.',
      });
    }

    startEpoch = fromEpochNumber;
    endEpoch = toEpochNumber;
  } else {
    // If requesting by year and week
    const { startEpoch: initialEpoch, endEpoch: finalEpoch } =
      convertYearWeekToEpochRange(year as number, week as number, userTimezone);
    startEpoch = initialEpoch;
    endEpoch = finalEpoch;
  }

  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId: userId,
        created_at_epoch_ms: {
          gte: startEpoch.toString(),
          lt: endEpoch.toString(),
        },
        is_valid: true,
      },
      orderBy: {
        created_at_epoch_ms: 'asc',
      },
    });

    res.status(200).json({ count: activities.length, activities });
  } catch (error) {
    next(error);
  }
};

//Get activities by user ID
const updateActivityById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: activityId } = req.params;
  const { ...payload } = req.body;

  try {
    const activities = await prisma.activity.update({
      where: {
        id: activityId,
      },
      data: {
        ...payload,
      },
    });
    res.status(200).json({ activities });
  } catch (error) {
    next(error);
  }
};

//Delete activity by ID
const deleteActivityById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const deletedActivity = await prisma.activity.delete({ where: { id } });
    res.status(200).json({ deletedActivity });
  } catch (error) {
    next(error);
  }
};

//ADMIN ONLY - Re-calculate week/year points based on saved activities
const reCalculateWeekPointsByUser = async (req: Request, res: Response) => {
  const { week = 0, year = 0, userId } = req.query;

  const weekInt = parseInt(week.toString());
  const yearInt = parseInt(year.toString());

  // Retrieve the user's current weekly scores
  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
    select: {
      weekly_scores: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const activities = await prisma.activity.findMany({
    where: {
      userId: userId as string,
      week_user_timezone: weekInt,
      year_user_timezone: yearInt,
      is_valid: true,
    },
  });

  let totalUserPoints: number = 0;

  if (activities) {
    totalUserPoints = await reCalculateActivitiesPoints(activities);
  }

  // Format the week-year string
  const weekYear = `${yearInt}-${weekInt.toString().padStart(2, '0')}`;

  // Update the weekly_scores object
  const weekly_scores = (user.weekly_scores as { [key: string]: number }) || {};
  const updatedWeeklyScores = {
    ...weekly_scores,
    [weekYear]: totalUserPoints,
  };

  // Save the updated weekly_scores to the user's record
  await prisma.user.update({
    where: {
      id: userId as string,
    },
    data: {
      weekly_scores: updatedWeeklyScores,
    },
  });

  return res.status(200).json({ totalUserPoints });
};

//Export
export {
  getAllActivities,
  getActivitiesByUserId,
  updateActivityById,
  deleteActivityById,
  reCalculateWeekPointsByUser,
};
