import { NextFunction, Request, Response } from 'express';
import { ICustomRequest } from '../types/custom-types';
import prisma from '../helpers/prisma-client';
import { validateAndRefreshGarminToken } from '../helpers/garmin-refresh-token';
import { DEBUG_MODE } from '../main';

const authGarmin = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as ICustomRequest).authenticatedUser.id;
  const {
    garmin_access_token,
    garmin_refresh_token,
    garmin_access_expires_at,
    garmin_user_id,
    image_url,
  } = req.body;
  DEBUG_MODE &&
    console.log(
      garmin_access_token,
      garmin_refresh_token,
      garmin_access_expires_at,
      garmin_user_id
    );

  try {
    const updateData = {
      garmin_access_token,
      garmin_refresh_token,
      garmin_access_expires_at,
      garmin_connected: true,
      garmin_user_id,
      ...(image_url && { image_url }), // Conditionally add imageURL
    };
    //Update user Strava info
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.status(200).json({
      msg: 'Logged in to Garmin',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const deauthGarmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as ICustomRequest).authenticatedUser.id;

  try {
    //Update user Garmin info
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        garmin_access_token: null,
        garmin_refresh_token: null,
        garmin_access_expires_at: null,
        garmin_connected: false,
        garmin_user_id: null,
      },
    });

    res.status(200).json({
      msg: 'Logged OUT from Garmin',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const refreshGarminToken = async (req: Request, res: Response) => {
  const user = (req as ICustomRequest).authenticatedUser;
  validateAndRefreshGarminToken(user);

  res.status(200).json({
    msg: 'OK',
  });
};
//Exports
export { authGarmin, deauthGarmin, refreshGarminToken };
