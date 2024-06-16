import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';

// League Controllers

// Create a League
const createLeague = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { level, category_id } = req.body;

  try {
    // Check if the category exists
    const category = await prisma.rankingCategory.findUnique({
      where: { id: category_id },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Create the league if the category exists
    const league = await prisma.rankingLeague.create({
      data: {
        level,
        category_id,
      },
    });

    res.status(200).json({ league });
  } catch (error) {
    next(error);
  }
};

// Read all Leagues
const getAllLeagues = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leagues = await prisma.rankingLeague.findMany({
      include: {
        category: true,
      },
    });
    res.status(200).json({ leagues });
  } catch (error) {
    next(error);
  }
};

// Read a Single League by ID
const getLeagueById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const league = await prisma.rankingLeague.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
    league
      ? res.status(200).json({ league })
      : res.status(404).json({ msg: 'League not found' });
  } catch (error) {
    next(error);
  }
};

// Update a League

const updateLeague = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { level, category_id } = req.body;

  try {
    // Validate that the provided category_id exists
    const categoryExists = await prisma.rankingCategory.findUnique({
      where: { id: category_id },
    });

    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Proceed to update the league if the category exists
    const league = await prisma.rankingLeague.update({
      where: { id },
      data: {
        level,
        category_id,
      },
    });

    res.status(200).json({ league });
  } catch (error) {
    next(error);
  }
};

// Delete a League
const deleteLeague = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    await prisma.rankingLeague.delete({
      where: { id },
    });
    res.status(204).send(); // No content to send back
  } catch (error) {
    next(error);
  }
};

// Exports
export {
  createLeague,
  getAllLeagues,
  getLeagueById,
  updateLeague,
  deleteLeague,
};
