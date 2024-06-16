import { DateTime } from 'luxon';
import prisma from './prisma-client';
import { User } from '@prisma/client';
import admin from 'firebase-admin';
import { sendPushNotification } from './firebase-init';

const createUserNotification = async (
  user: User,
  importance: number,
  type: string,
  message: string,
  title: string
) => {
  const createdAt = DateTime.utc();
  const createdAtUserTimeZone = createdAt.setZone(user.timezone.substring(12));

  try {
    const notification = await prisma.userNotifications.create({
      data: {
        created_at: createdAt.toISO()!,
        created_at_user_timezone: createdAtUserTimeZone.toISO()!,
        importance,
        type,
        title,
        message,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    sendPushNotification(user, importance, type, message, title);
  } catch (error) {
    throw error;
  }
};

//Exports
export { createUserNotification };
