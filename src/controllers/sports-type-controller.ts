// controllers/sportTypes-controller.js

import { Request, Response, NextFunction } from 'express';
import prisma from '../helpers/prisma-client';

// C - Create a SportType
const createSportType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, description } = req.body;

  try {
    // Check if there is a sport with the same name first (case insensitive)
    const existingSportType = await prisma.sportType.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive', // Enables case-insensitive query
        },
      },
    });

    // If a sport type with the same name exists, return an error
    if (existingSportType) {
      return res
        .status(409)
        .json({ message: 'A sport type with the same name already exists.' });
    }

    // If no existing sport type, create a new one
    const sportType = await prisma.sportType.create({
      data: {
        name,
        description,
        created_at: new Date().toISOString(),
      },
    });
    return res.status(201).json(sportType);
  } catch (error) {
    next(error);
  }
};

// R - Get all SportTypes
const getAllSportTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sportTypes = await prisma.sportType.findMany();
    return res.status(200).json(sportTypes);
  } catch (error) {
    next(error);
  }
};

// R - Get SportType by ID
const getSportTypeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const sportType = await prisma.sportType.findUnique({
      where: { id },
    });
    if (!sportType) {
      return res.status(404).json({ message: 'SportType not found' });
    }
    return res.status(200).json(sportType);
  } catch (error) {
    next(error);
  }
};

// U - Update SportType by ID
const updateSportTypeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const sportType = await prisma.sportType.update({
      where: { id },
      data: {
        name,
        description,
      },
    });
    return res.status(200).json(sportType);
  } catch (error) {
    next(error);
  }
};

// D - Delete SportType by ID
const deleteSportTypeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    await prisma.sportType.delete({
      where: { id },
    });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  createSportType,
  getAllSportTypes,
  getSportTypeById,
  updateSportTypeById,
  deleteSportTypeById,
};
