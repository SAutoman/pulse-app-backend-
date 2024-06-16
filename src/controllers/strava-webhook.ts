import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';
import axios from 'axios';
import { validateAndRefreshStravaToken } from '../helpers/strava-refresh-token';
import { incrementUserScoreBasedOnActivity } from '../helpers/score-increment-activity';
import { DEBUG_MODE } from '../main';
import { checkIfActivityExists } from '../helpers/strava-activity-duplicated';
import { sendEmailNewActivity } from '../helpers/notification-helper/email-new-activity';
import { DateTime } from 'luxon';
import { User } from '@prisma/client';
import { isActivityValid } from '../helpers/activity-validation';
import { createUserNotification } from '../helpers/create-user-notification';
import { calculatePoints } from '../helpers/points-calculator';
import { logMissionProgress } from '../helpers/activity-log-mission-progress';
import { evaluateActivityRelatedBadges } from '../helpers/badges-helpers/evaluate-activity-related-badges';
import { evaluateDisciplineRelatedBadges } from '../helpers/badges-helpers/evaluate-discipline-related-badges';

const receivedEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*
{
  aspect_type: 'create',
  event_time: 1696436789,
  object_id: 9976080028,
  object_type: 'activity',
  owner_id: 22947703,
  subscription_id: 249485,
  updates: {}
}
  */

  const {
    aspect_type,
    event_time,
    object_id,
    object_type,
    owner_id,
    subscription_id,
    updates,
  } = req.body;
  console.log(
    '=========================== STRAVA EVENT RECEIVED ===================='
  );
  console.log(
    'Aspect Type: ',
    aspect_type,
    ' Object Id: ',
    object_id,
    ' Owner Id: ',
    owner_id
  );

  //Check if the type of event needs to be handled
  if (aspect_type !== 'create') {
    res.status(200).send('EVENT_RECEIVED_NOT_CREATE');
    console.log('Event not handled');
    console.log(
      '********************************** END *******************************'
    );
    return;
  }

  //Check if the activity already exists in the DB, to avoid duplicates
  try {
    const isDuplicated = await checkIfActivityExists(object_id.toString());
    if (isDuplicated) {
      res.status(200).send('EVENT_RECEIVED_DUPLICATED_ACTIVITY');
      console.log('Event not handled - Duplicated');
      console.log(
        '********************************** END *******************************'
      );
      return;
    }
  } catch (error) {
    next(error);
    return;
  }

  // Get user from Database
  let user: User | null;
  try {
    user = await prisma.user.findFirst({
      where: { strava_user_id: owner_id },
    });

    //Check if user B was not found in the DB
    if (user === null) {
      next(new Error('The user was not found in the DB'));
      return;
    }
    //Validate STRAVA token is still valid or refresh
    await validateAndRefreshStravaToken(user!);
  } catch (error) {
    next(error);
    return;
  }

  // Get user again with validated token from Database
  let userB: User | null;
  try {
    userB = await prisma.user.findFirst({
      where: { strava_user_id: owner_id },
    });
  } catch (error) {
    next(error);
    return;
  }

  // Get activity details
  const accessToken = userB!.strava_access_token;
  const apiUrl = `https://www.strava.com/api/v3/activities/${object_id}?access_token=${accessToken}`;

  try {
    axios
      .get(apiUrl)
      .then(async (response) => {
        const {
          id,
          name,
          distance,
          moving_time,
          elapsed_time,
          total_elevation_gain,
          type,
          sport_type,
          workout_type,
          start_date,
          start_date_local,
          timezone,
          utc_offset,
          location_city,
          location_state,
          location_country,
          achievement_count,
          kudos_count,
          comment_count,
          athlete_count,
          photo_count,
          visibility,
          manual,
          private: is_private,
          has_heartrate,
          average_heartrate,
          max_heartrate,
          calories,
          map,
          average_speed,
          max_speed,
          average_cadence,
          average_temp,
          average_watts,
          weighted_average_watts,
          kilojoules,
          device_watts,
          elev_high,
          elev_low,
          device_name,
          start_latlng,
          end_latlng,
        } = response.data;

        //Get user Zone
        const userZone = userB!.timezone;
        const formattedUserZone = userZone.substring(12);

        //Set created at in UTC and in the user's country timezone
        const createdAt = DateTime.utc();
        const createdAtUserTimezone = createdAt.setZone(formattedUserZone);

        //Handle STRAVA Dates (using the activity timezone)
        const stravaStartDate = DateTime.fromISO(start_date, { zone: 'UTC' });
        const activityTimezone = timezone.substring(12);
        const stravaStartDateLocal = stravaStartDate.setZone(activityTimezone);

        //Handle STRAVA Dates (using the user timezone)
        const stravaStartDateUserZone =
          stravaStartDate.setZone(formattedUserZone);

        //Caculate points for the activity
        const { points, effortFactor } = calculatePoints(
          average_heartrate ?? 0,
          moving_time ?? 0
        );

        // Calculate epoch milliseconds for created_at and start_date
        const created_at_epoch_ms = createdAt.toMillis();
        const start_date_epoch_ms = stravaStartDate.toMillis();

        // Assuming elapsed_time is already in seconds, convert to milliseconds and add to start_date to get end_date_epoch_ms
        const end_date_epoch_ms = start_date_epoch_ms + elapsed_time * 1000;

        //Validate if date is in the same week, HR over 90bpm and is not overlapping another one
        const { isValid, invalidMessage } = await isActivityValid(
          createdAtUserTimezone,
          stravaStartDateUserZone,
          average_heartrate,
          userB!.id,
          stravaStartDateUserZone.weekNumber,
          start_date_epoch_ms.toString(),
          end_date_epoch_ms.toString()
        );

        console.log('Dates Created', created_at_epoch_ms);
        console.log('Dates Start', start_date_epoch_ms, end_date_epoch_ms);
        console.log('Dates End', end_date_epoch_ms);

        console.log('Strava ID', id.toString());
        console.log('Invalid Message: ', invalidMessage);

        // Save activity into DB
        const newActivity = await prisma.activity.create({
          data: {
            created_at: createdAt.toISO()!,
            created_at_user_timezone: createdAtUserTimezone.toISO()!,
            strava_id: id.toString(),
            name,
            distance,
            moving_time,
            elapsed_time,
            total_elevation_gain,
            type,
            sport_type,
            start_date: stravaStartDate.toISO()!,
            start_date_local: stravaStartDateLocal.toISO()!,
            start_date_user_timezone: stravaStartDateUserZone.toISO()!,
            timezone,
            utc_offset,
            location_city,
            location_state,
            location_country,
            workout_type: null,
            achievement_count,
            kudos_count,
            comment_count,
            athlete_count,
            photo_count,
            visibility,
            manual,
            is_private,
            has_heartrate,
            average_heartrate,
            max_heartrate,
            calories,
            map,
            average_speed,
            max_speed,
            average_cadence,
            average_temp,
            average_watts,
            weighted_average_watts,
            kilojoules,
            device_watts,
            elev_high,
            elev_low,
            device_name,
            start_latlng: start_latlng ?? [],
            end_latlng: end_latlng ?? [],
            is_valid: isValid,
            invalid_messsage: invalidMessage,
            week_user_timezone: stravaStartDateUserZone.weekNumber,
            year_user_timezone: stravaStartDateUserZone.year,
            calculated_points: points,
            calculated_met: effortFactor,
            created_at_epoch_ms: created_at_epoch_ms.toString(),
            start_date_epoch_ms: start_date_epoch_ms.toString(),
            end_date_epoch_ms: end_date_epoch_ms.toString(),
            // userId: user!.id,
            user: {
              connect: {
                id: userB!.id,
              },
            },
          },
        });

        //Increment score with the new activity (only when valid)
        if (isValid) {
          await incrementUserScoreBasedOnActivity(newActivity, userB!);
        }
        console.log(
          'New Activity Saved : ',
          'Calories: ',
          newActivity.calories,
          'Activity Id: ',
          newActivity.id,
          'Is valid:',
          newActivity.is_valid
        );

        //Send email notifications if allowed
        if (userB!.email_notifications_allowed) {
          sendEmailNewActivity(newActivity, userB!, next);
        }

        //Create notification to the user
        if (isValid) {
          createUserNotification(
            userB!,
            2,
            'NEW_ACTIVITY',
            `New activity registered with ${newActivity.calculated_points} points.`,
            `Activity "${newActivity.name}" registered.`
          );
        } else {
          createUserNotification(
            userB!,
            2,
            'INVALID_ACTIVITY',
            `Your activity ${newActivity.name} was not valid. ${newActivity.invalid_messsage}`,
            `Activity "${newActivity.name}" was invalid.`
          );
        }

        //Validate Missions
        await logMissionProgress(newActivity, userB!);

        //Validate badges to be awarded based on the new activity
        if (isValid) {
          await evaluateActivityRelatedBadges(userB!, newActivity);
          evaluateDisciplineRelatedBadges(userB!, newActivity);
        }

        console.log('User : ', userB?.email);
        console.log(
          '********************************** END *******************************'
        );
      })
      .catch((error) => {
        console.log('Error', error);
        console.log(
          '********************************** END *******************************'
        );
      });

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    next(error);
  }
};

//This endpoint is usefull for webhook config only
const getWebhook = (req: Request, res: Response) => {
  DEBUG_MODE && console.log('STAVA reached my server');

  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = 'STRAVA';
  // Parses the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Verifies that the mode and token sent are valid
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      DEBUG_MODE && console.log('WEBHOOK_VERIFIED');
      res.json({ 'hub.challenge': challenge });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

//Exports
export { receivedEvent, getWebhook };
