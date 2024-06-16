import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';
import { DateTime } from 'luxon';
import { finalizeMission } from '../helpers/missions-helpers/close-mission';

// C - Create a Mission (ADMIN Only)
const createMission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    description,
    goal_type,
    goal_value,
    measure_unit,
    initial_day,
    end_day,
    sport_type,
    image_url,
    is_public,
  } = req.body;

  try {
    const mission = await prisma.mission.create({
      data: {
        name,
        description,
        goal_type,
        goal_value,
        measure_unit,
        is_active: true,
        created_at: DateTime.now().toISO()!,
        initial_day,
        end_day,
        sport_type,
        image_url,
        is_public,
      },
    });
    return res.status(200).json({ mission });
  } catch (error) {
    next(error);
  }
};

// R - Read mission by id
const getMissionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const mission = await prisma.mission.findFirst({
      where: { id },
    });

    if (!mission) {
      return res.status(400).json({ msg: 'The mission does not exist!' });
    }

    return res.status(200).json({ mission });
  } catch (error) {
    next(error);
  }
};

// R - Read all ACTIVE missions
const getAllActiveMissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { is_active: true },
    });

    if (!missions) {
      return res.status(400).json({ msg: 'There are no missions active!' });
    }

    return res.status(200).json({ missions });
  } catch (error) {
    next(error);
  }
};

// R - Read all ACTIVE missions available to a specific user
const getActiveMissionsForUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract userId from request, assuming it's passed as a query parameter or part of the request body
    const { userId } = req.params;

    //Validate if user exists
    const foundUser = await prisma.user.findFirst({ where: { id: userId } });

    if (!foundUser) {
      return res.status(400).json({ msg: 'User does not exists' });
    }

    // First, find all clubs the user belongs to
    const userClubs = await prisma.userClub.findMany({
      where: {
        user_id: userId as string,
      },
      select: { id: true, club_id: true },
    });
    console.log(userClubs);

    const userClubIds = userClubs.map((uc) => uc.club_id);
    console.log(userClubIds);

    // Then, find all missions that are either public or available to one of the user's clubs and are active
    const missions = await prisma.mission.findMany({
      where: {
        is_active: true, // Only include active missions
        OR: [
          { is_public: true }, // Public missions
          {
            mission_clubs: {
              some: {
                club_id: {
                  in: userClubIds,
                },
              },
            },
          }, // Missions available to one of the user's clubs
        ],
      },
    });

    if (!missions.length) {
      return res
        .status(200)
        .json({ msg: 'There are no active missions available for this user.' });
    }

    return res.status(200).json({ missions });
  } catch (error) {
    next(error);
  }
};

// U - Update mission by id
const updateMissionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: missionId } = req.params;
  const { id, created_at, ...rest } = req.body;

  try {
    //Check if the mission exists
    const missionFound = await prisma.mission.findFirst({
      where: { id: missionId },
    });

    if (!missionFound) {
      return res.status(400).json({ msg: 'The mission does not exist!' });
    }

    const mission = await prisma.mission.update({
      where: { id: missionId },
      data: { ...rest },
    });

    return res.status(200).json({ mission });
  } catch (error) {
    next(error);
  }
};

// D - Delete mission by id
const deleteMissionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    //Check if the mission exists
    const missionFound = await prisma.mission.findFirst({ where: { id } });

    if (!missionFound) {
      return res.status(400).json({ msg: 'The mission does not exist!' });
    }

    //Delete mission
    const mission = await prisma.mission.delete({
      where: { id },
    });

    return res.status(200).json({ mission });
  } catch (error) {
    next(error);
  }
};

// P - Finalize all missions before today
const finalizeAllMissionsBeforeToday = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const endedMissions = await prisma.mission.findMany({
      where: {
        end_day: {
          lte: today,
        },
        is_active: true, // Consider only active missions
      },
    });

    if (endedMissions.length > 0) {
      console.log(`Found ${endedMissions.length} missions to finalize`);
      for (const mission of endedMissions) {
        await finalizeMission(mission.id);
      }
    } else {
      console.log('No missions to finalize today');
    }
    return res.status(200).json({ count: endedMissions.length, endedMissions });
  } catch (error) {
    next(error);
  }
};

// P - Finalize a mission by ID
const finalizeMissionByID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { missionId } = req.params;
  try {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const foundMission = await prisma.mission.findFirst({
      where: {
        id: missionId,
      },
    });

    if (!foundMission) {
      return res.status(400).json({ error: 'The mission does not exist' });
    } else if (foundMission.is_active === false) {
      return res
        .status(400)
        .json({ error: 'The mission is already finalized' });
    } else {
      const finalizedMission = await prisma.mission.update({
        where: {
          id: foundMission.id,
        },
        data: {
          is_active: false,
        },
      });
      return res.status(200).json({ finalizedMission });
    }
  } catch (error) {
    next(error);
  }
};
//Exports
export {
  createMission,
  getMissionById,
  updateMissionById,
  deleteMissionById,
  getAllActiveMissions,
  getActiveMissionsForUser,
  finalizeAllMissionsBeforeToday,
  finalizeMissionByID,
};
