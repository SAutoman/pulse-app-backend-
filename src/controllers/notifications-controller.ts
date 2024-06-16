import { NextFunction, Request, Response } from 'express';
import { ICustomRequest } from '../types/custom-types';
import prisma from '../helpers/prisma-client';

//R - Get all notifications by user ID
const getNotificationsByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page = 1, limit = 10 } = req.query;
  const authenticatedUser = (req as ICustomRequest).authenticatedUser;

  try {
    const notifications = await prisma.userNotifications.findMany({
      where: {
        userId: authenticatedUser.id,
      },
      orderBy: {
        created_at_user_timezone: 'desc',
      },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    //Count unread notifications
    const unreadNotifications = await prisma.userNotifications.count({
      where: {
        userId: authenticatedUser.id,
        isRead: false,
      },
    });

    return res.status(200).json({
      msg: 'Notifications OK',
      notifications,
      unreadNotifications,
    });
  } catch (error) {
    next(error);
  }
};

//U - Update a notfication by ID as READ
const updateReadNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: notificationId } = req.params;
  const authenticatedUser = (req as ICustomRequest).authenticatedUser;

  try {
    //Validate if notification exists
    const notfication = await prisma.userNotifications.findFirst({
      where: { id: notificationId },
    });
    if (!notfication) {
      return res.status(400).json({
        msg: `The notification with id ${notificationId} does not exist.`,
      });
    }

    //Update notification as read
    const updatedNotification = await prisma.userNotifications.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res
      .status(200)
      .json({ status: true, notfication: updatedNotification });
  } catch (error) {
    next(error);
  }
};

// U - Update multiple notifications as READ
const updateReadNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { notificationIds } = req.body; // Expect an array of IDs
  const authenticatedUser = (req as ICustomRequest).authenticatedUser;

  try {
    // Validate if notifications exist and belong to the authenticated user
    const notifications = await prisma.userNotifications.findMany({
      where: {
        id: {
          in: notificationIds,
        },
        userId: authenticatedUser.id, // Ensure the notifications belong to the user
      }
    });

    if (notifications.length !== notificationIds.length) {
      return res.status(400).json({
        msg: "One or more notifications do not exist or do not belong to the authenticated user.",
      });
    }

    // Update notifications as read
    const updatedNotifications = await prisma.userNotifications.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
        userId: authenticatedUser.id, // Ensure the notifications belong to the user
        isRead: false, // Only update unread notifications
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      status: true,
      message: `${updatedNotifications.count} notifications marked as read.`,
    });
  } catch (error) {
    next(error);
  }
};


//D - Delete a notfication by ID
const deleteNotificationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: notificationId } = req.params;

  try {
    //Validate if notification exists
    const notfication = await prisma.userNotifications.findFirst({
      where: { id: notificationId },
    });
    if (!notfication) {
      return res.status(400).json({
        msg: `The notification with id ${notificationId} does not exist.`,
      });
    }

    //Delete notification
    await prisma.userNotifications.delete({
      where: { id: notificationId },
    });

    return res.status(200).json({
      msg: `Notification with id: ${notificationId} has been deleted`,
    });
  } catch (error) {
    next(error);
  }
};

//Exports
export {
  getNotificationsByUserId,
  updateReadNotification,
  deleteNotificationById,
  updateReadNotifications
};
