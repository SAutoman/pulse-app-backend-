import { NextFunction, Request, Response } from 'express';
import { ICustomRequest } from '../types/custom-types';
import prisma from '../helpers/prisma-client';
import { validateAndRefreshStravaToken } from '../helpers/strava-refresh-token';
import { DEBUG_MODE } from '../main';

const authStrava = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as ICustomRequest).authenticatedUser.id;
  const {
    strava_access_token,
    strava_refresh_token,
    strava_access_expires_at,
    strava_user_id,
    image_url,
  } = req.body;
  DEBUG_MODE &&
    console.log(
      strava_access_token,
      strava_refresh_token,
      strava_access_expires_at,
      strava_user_id
    );

  try {
    const updateData = {
      strava_access_token,
      strava_refresh_token,
      strava_access_expires_at,
      strava_connected: true,
      strava_user_id,
      ...(image_url && { image_url }), // Conditionally add imageURL
    };
    //Update user Strava info
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.status(200).json({
      msg: 'Logged in to Strava',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const deauthStrava = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as ICustomRequest).authenticatedUser.id;

  try {
    //Update user Strava info
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        strava_access_token: null,
        strava_refresh_token: null,
        strava_access_expires_at: null,
        strava_connected: false,
        strava_user_id: null,
      },
    });

    res.status(200).json({
      msg: 'Logged OUT from Strava',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const refreshStravaToken = async (req: Request, res: Response) => {
  const user = (req as ICustomRequest).authenticatedUser;
  validateAndRefreshStravaToken(user);

  res.status(200).json({
    msg: 'OK',
  });
};
//Exports
export { authStrava, deauthStrava, refreshStravaToken };
