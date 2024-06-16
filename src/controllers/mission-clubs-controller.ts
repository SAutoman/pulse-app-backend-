import { Request, Response, NextFunction } from 'express';
import prisma from '../helpers/prisma-client';
import { DateTime } from 'luxon';

//C - Create a MissionClub association
export const createMissionClub = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { mission_id, club_id } = req.body;
  try {
    // Check if the association already exists
    const existingAssociation = await prisma.missionClub.findFirst({
      where: {
        mission_id: mission_id,
        club_id: club_id,
      },
    });

    if (existingAssociation) {
      return res
        .status(400)
        .json({ message: 'This MissionClub association already exists.' });
    }

    // If the association does not exist, create a new one
    const missionClub = await prisma.missionClub.create({
      data: {
        mission_id: mission_id, // Ensure these field names match your schema definitions
        club_id: club_id,
        created_at: DateTime.utc().toISO()!,
      },
    });

    res.status(200).json({ missionClub });
  } catch (error) {
    next(error);
  }
};

//R - Get all MissionClub associations
export const getMissionClubs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const missionClubs = await prisma.missionClub.findMany();
    res.status(200).json({ missionClubs });
  } catch (error) {
    next(error);
  }
};

//R - Get a single MissionClub association by ID
export const getMissionClubById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const missionClub = await prisma.missionClub.findUnique({
      where: { id },
    });
    if (missionClub) {
      res.status(200).json({ missionClub });
    } else {
      res.status(404).send('MissionClub not found');
    }
  } catch (error) {
    next(error);
  }
};

//U - Update a MissionClub association (not used)
export const updateMissionClub = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { mission_id, club_id } = req.body;
  try {
    const missionClub = await prisma.missionClub.update({
      where: { id },
      data: {
        mission_id,
        club_id,
      },
    });
    res.status(200).json(missionClub);
  } catch (error) {
    next(error);
  }
};

//D - Delete a MissionClub association
export const deleteMissionClub = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const deletedMissionClub = await prisma.missionClub.delete({
      where: { id },
    });
    res.status(200).json({ deletedMissionClub });
  } catch (error) {
    next(error);
  }
};
