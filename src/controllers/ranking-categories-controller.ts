import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';

// Category Controllers

// Create a Category
const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, order } = req.body;
  try {
    const category = await prisma.rankingCategory.create({
      data: {
        name,
        order,
      },
    });
    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
};

// Read all Categories
const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.rankingCategory.findMany();
    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

// Read a Single Category by ID
const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const category = await prisma.rankingCategory.findUnique({
      where: { id },
    });
    category
      ? res.status(200).json({ category })
      : res.status(404).json({ msg: 'Category not found' });
  } catch (error) {
    next(error);
  }
};

// Update a Category
const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { name, order } = req.body;
  try {
    const category = await prisma.rankingCategory.update({
      where: { id },
      data: {
        name,
        order,
      },
    });
    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
};

// Delete a Category
const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    await prisma.rankingCategory.delete({
      where: { id },
    });
    res.status(204).send(); // No content to send back
  } catch (error) {
    next(error);
  }
};

// Exports
export {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
