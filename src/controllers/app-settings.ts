import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

const getMaintenanceMode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await prisma.appSettings.findMany({});
    res.status(200).json({ settings });
  } catch (error) {
    next(error);
  }
};

export { getMaintenanceMode };
