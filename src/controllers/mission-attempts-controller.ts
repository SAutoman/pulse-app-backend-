import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';
import { DateTime } from 'luxon';

// C - Sign up user for a mission
const signUserToMission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, missionId, timezone } = req.query;

  const userTimezone = (timezone as string).substring(12);

  try {
    //Check if user exists
    const foundUser = await prisma.user.findFirst({
      where: { id: userId as string, is_active: true },
    });

    if (!foundUser)
      return res
        .status(400)
        .json({ msg: `User with id ${userId} does not exist` });

    //Check if mission exists
    const foundMission = await prisma.mission.findFirst({
      where: { id: missionId as string, is_active: true },
    });

    if (!foundMission)
      return res.status(400).json({
        msg: `Mission with id ${userId} does not exist or is no longer active`,
      });

    //If the user already has an attempt for that mission, return error
    const foundAttempt = await prisma.missionAttempt.findFirst({
      where: { mission_id: missionId as string, user_id: userId as string },
    });

    if (foundAttempt) {
      return res.status(400).json({
        error: 'The user already has a mission attempt related to the mission.',
      });
    }

    //Calculate initial and end dates
    const [initialYear, initialMonth, initialDay] =
      foundMission.initial_day.split('-');

    const initialDate = DateTime.fromObject(
      {
        year: parseInt(initialYear),
        month: parseInt(initialMonth),
        day: parseInt(initialDay),
      },
      { zone: userTimezone }
    );

    const [endYear, endMonth, endDay] = foundMission.end_day.split('-');

    const endDate = DateTime.fromObject(
      {
        year: parseInt(endYear),
        month: parseInt(endMonth),
        day: parseInt(endDay),
        hour: 23,
        minute: 59,
        second: 59,
      },
      { zone: userTimezone }
    );

    //Create the mission attempt
    const missionAttempt = await prisma.missionAttempt.create({
      data: {
        start_date: initialDate.toISO()!,
        end_date: endDate.toISO()!,
        start_date_user_timezone: initialDate.toISO()!,
        end_date_user_timezone: endDate.toISO()!,
        status: 'ACTIVE',
        user_id: userId as string,
        mission_id: missionId as string,
        timezone: timezone as string,
      },
      include: { mission: true },
    });

    return res.status(200).json({ missionAttempt });
  } catch (error) {
    next(error);
  }

  return res.status(200).json({ msg: 'Sing up user' });
};

// R - Get mission attempt by id
const getMissionAttemptById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    //Check if the mission attempt exists
    const missionAttempt = await prisma.missionAttempt.findFirst({
      where: { id },
      include: {
        mission: true,
      },
    });

    if (!missionAttempt) {
      return res
        .status(400)
        .json({ msg: 'The mission attempt does not exist!' });
    }

    return res.status(200).json({ missionAttempt });
  } catch (error) {
    next(error);
  }
};

// R - Get all ACTIVE mission attempts for user
const getActiveMissionAttempts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, active = 'true' } = req.query;

  // Convert active to boolean (it comes as string from query params)
  const isActive = active === 'true';
  console.log(isActive);

  try {
    let whereClause: any = {
      user_id: userId as string,
    };

    // Dynamically update whereClause based on isActive
    if (isActive) {
      whereClause['status'] = 'ACTIVE';
    } else {
      // Include items where status is not 'ACTIVE'
      whereClause['status'] = { not: 'ACTIVE' };
    }

    //Check if the mission attempt exists
    const missionAttempts = await prisma.missionAttempt.findMany({
      where: whereClause,
      include: {
        mission: true,
        mission_progress: { include: { activity: true } },
      },
    });

    return res.status(200).json({ missionAttempts });
  } catch (error) {
    next(error);
  }
};

// D - Delete mission attempt by id
const deleteMissionAttemptById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { missionAttemptId } = req.query;

  try {
    //Check if the mission attempt exists
    const missionAttemptFound = await prisma.missionAttempt.findFirst({
      where: { id: missionAttemptId as string },
    });

    if (!missionAttemptFound) {
      return res
        .status(400)
        .json({ msg: 'The mission attempt does not exist!' });
    }

    //Delete Mission Attempt
    const missionAttempt = await prisma.missionAttempt.delete({
      where: { id: missionAttemptId as string },
    });

    return res.status(200).json({ missionAttempt });
  } catch (error) {
    next(error);
  }
};

//Export
export {
  signUserToMission,
  deleteMissionAttemptById,
  getMissionAttemptById,
  getActiveMissionAttempts,
};
