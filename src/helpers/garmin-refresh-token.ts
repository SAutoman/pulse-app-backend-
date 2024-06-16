import { User } from '@prisma/client';
import prisma from './prisma-client';
import axios from 'axios';
import { DEBUG_MODE } from '../main';
import { throws } from 'assert';

const validateAndRefreshGarminToken = async (user: User) => {
  if (user.garmin_connected && user.garmin_access_expires_at !== null) {
    const expireDate = new Date(user.garmin_access_expires_at * 1000);
    const currentDate = new Date();

    DEBUG_MODE && console.log('User:', user);
    DEBUG_MODE && console.log('Expire Date:', expireDate);
    DEBUG_MODE && console.log('Current Date:', currentDate);

    if (expireDate > currentDate) {
      DEBUG_MODE && console.log('Token is still valid');
    } else {
      DEBUG_MODE && console.log('Token has expired');
      const client_id = process.env.GARMIN_CLIENT_ID;
      const client_secret = process.env.GARMIN_CLIENT_SECRET;
      const refreshToken = user.garmin_refresh_token;

      const apiUri = `https://oauth2.garmin.com/oauth/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
      const response = await axios.post(apiUri);
      const { access_token, expires_at, refresh_token } = response.data;
      DEBUG_MODE && console.log(access_token, expires_at, refresh_token);

      //Guardar en DB los nuevos valores para usar en el request a GARMIN
      try {
        const modifiedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            garmin_access_token: access_token,
            garmin_refresh_token: refreshToken,
            garmin_access_expires_at: expires_at,
          },
        });
        DEBUG_MODE && console.log('Modified User', modifiedUser);
      } catch (error) {
        throw error;
      }
    }
  }
};

export { validateAndRefreshGarminToken };
