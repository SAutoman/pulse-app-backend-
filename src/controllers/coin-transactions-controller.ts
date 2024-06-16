import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';

// Function to fetch coin transactions by user
export const getCoinTransactionsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;
  try {
    const transactions = await prisma.coinTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at_epoch_ms: 'desc' },
    });
    res.json({ count: transactions.length, transactions });
  } catch (error) {
    console.error('Error fetching coin transactions:', error);
    next(error);
  }
};

// Function to create a new coin transaction 
export const addCoinTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user_id, amount, type, description } = req.body;
  try {
    const newTransaction = await prisma.coinTransaction.create({
      data: {
        user_id,
        amount,
        type,
        description,
        created_at_epoch_ms: new Date().getTime().toString(),
      },
    });

    res.status(201).json({ newTransaction });
  } catch (error) {
    console.error('Error creating coin transaction:', error);
    next(error);
  }
};

module.exports = {
  getCoinTransactionsByUser,
  addCoinTransaction,
};
