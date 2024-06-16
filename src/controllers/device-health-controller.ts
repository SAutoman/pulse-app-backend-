import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';
import { incrementUserScoreBasedOnActivity } from '../helpers/score-increment-activity';
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

// New endpoint to handle health service workouts
const receivedHealthWorkouts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { workouts } = req.body;

  console.log(
    '=========================== HEALTH SERVICE WORKOUTS RECEIVED ===================='
  );

  for (const workout of workouts) {
    const {
      workoutId,
      userId,
      workoutType,
      distance,
      distanceUnit,
      energyBurned,
      startDateUtc,
      endDateUtc,
      averageHeartRate,
      maxHeartRate,
      timeOffset,
      sourceName,
    } = workout;

    console.log('Workout ID: ', workoutId, ' User ID: ', userId);

    // Check if the activity already exists in the DB, to avoid duplicates
    try {
      const isDuplicated = await checkIfActivityExists(workoutId.toString());
      if (isDuplicated) {
        console.log('Event not handled - Duplicated');
        console.log(
          '********************************** END *******************************'
        );
        continue;
      }
    } catch (error) {
      next(error);
      return;
    }

    // Get user from Database
    let user: User | null;
    try {
      user = await prisma.user.findFirst({
        where: { id: userId },
      });

      // Check if user was not found in the DB
      if (user === null) {
        next(new Error('The user was not found in the DB'));
        return;
      }
    } catch (error) {
      next(error);
      return;
    }

    // Set created at in UTC and in the user's country timezone
    const createdAt = DateTime.utc();
    const formattedUserZone = user.timezone.substring(12);
    const createdAtUserTimezone = createdAt.setZone(formattedUserZone);

    // Handle workout Dates (already in UTC)
    const workoutStartDate = DateTime.fromISO(startDateUtc).setZone('utc');
    const workoutEndDate = DateTime.fromISO(endDateUtc).setZone('utc');
    const workoutStartDateUserZone =
      workoutStartDate.setZone(formattedUserZone);
    const workoutEndDateUserZone = workoutEndDate.setZone(formattedUserZone);

    // Calculate points for the activity
    try {
      const { points, effortFactor } = calculatePoints(
        averageHeartRate ?? 0,
        workoutEndDate.diff(workoutStartDate, 'seconds').seconds ?? 0
      );

      // Calculate epoch milliseconds for created_at and start_date
      const created_at_epoch_ms = createdAt.toMillis();
      const start_date_epoch_ms = workoutStartDate.toMillis();
      const end_date_epoch_ms = workoutEndDate.toMillis();

      console.log(createdAtUserTimezone.toISO());
      console.log(workoutStartDateUserZone.toISO());
      console.log(averageHeartRate);
      console.log(user.id);
      console.log(workoutStartDateUserZone.weekNumber);
      console.log(start_date_epoch_ms.toString());
      console.log(end_date_epoch_ms.toString());

      // Validate if date is in the same week, HR over 90bpm and is not overlapping another one

      const { isValid, invalidMessage } = await isActivityValid(
        createdAtUserTimezone,
        workoutStartDateUserZone,
        averageHeartRate,
        user.id,
        workoutStartDateUserZone.weekNumber,
        start_date_epoch_ms.toString(),
        end_date_epoch_ms.toString()
      );

      console.log('Dates Created', created_at_epoch_ms);
      console.log('Dates Start', start_date_epoch_ms, end_date_epoch_ms);
      console.log('Dates End', end_date_epoch_ms);

      console.log('Workout ID', workoutId);
      console.log('Invalid Message: ', invalidMessage);

      const averageSpeed =
        parseFloat(
          (
            distance / workoutEndDate.diff(workoutStartDate, 'seconds').seconds
          ).toFixed(3)
        ) ?? 0;

      // Save activity into DB

      const newActivity = await prisma.activity.create({
        data: {
          created_at: createdAt.toISO()!,
          created_at_user_timezone: createdAtUserTimezone.toISO()!,
          strava_id: workoutId.toString(), // or another identifier if not from Strava
          name: workoutType,
          distance,
          moving_time: parseInt(
            workoutEndDate.diff(workoutStartDate, 'seconds').seconds.toFixed(0)
          ),
          elapsed_time: parseInt(
            workoutEndDate.diff(workoutStartDate, 'seconds').seconds.toFixed(0)
          ),
          total_elevation_gain: 0,
          type: workoutType,
          sport_type: workoutType,
          start_date: workoutStartDate.toISO()!,
          start_date_local: workoutStartDateUserZone.toISO()!,
          start_date_user_timezone: workoutStartDateUserZone.toISO()!,
          timezone: user.timezone,
          utc_offset: timeOffset,
          location_city: null,
          location_state: null,
          location_country: null,
          workout_type: null,
          achievement_count: 0,
          kudos_count: 0,
          comment_count: 0,
          athlete_count: 0,
          photo_count: 0,
          visibility: 'everyone',
          manual: false,
          is_private: false,
          has_heartrate: !!averageHeartRate,
          average_heartrate: averageHeartRate,
          max_heartrate: maxHeartRate,
          calories: energyBurned,
          map: {},
          average_speed: averageSpeed,
          max_speed: null,
          average_cadence: null,
          average_temp: null,
          average_watts: null,
          weighted_average_watts: null,
          kilojoules: null,
          device_watts: null,
          elev_high: null,
          elev_low: null,
          device_name: sourceName,
          start_latlng: [],
          end_latlng: [],
          is_valid: isValid,
          invalid_messsage: invalidMessage,
          week_user_timezone: workoutStartDateUserZone.weekNumber,
          year_user_timezone: workoutStartDateUserZone.year,
          calculated_points: points,
          calculated_met: effortFactor,
          created_at_epoch_ms: created_at_epoch_ms.toString(),
          start_date_epoch_ms: start_date_epoch_ms.toString(),
          end_date_epoch_ms: end_date_epoch_ms.toString(),
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      // Increment score with the new activity (only when valid)
      if (isValid) {
        await incrementUserScoreBasedOnActivity(newActivity, user);
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

      // Send email notifications if allowed
      if (user.email_notifications_allowed) {
        sendEmailNewActivity(newActivity, user, next);
      }

      // Create notification to the user
      if (isValid) {
        createUserNotification(
          user,
          2,
          'NEW_ACTIVITY',
          `New activity registered with ${newActivity.calculated_points} points.`,
          `Activity "${newActivity.name}" registered.`
        );
      } else {
        createUserNotification(
          user,
          2,
          'INVALID_ACTIVITY',
          `Your activity ${newActivity.name} was not valid. ${newActivity.invalid_messsage}`,
          `Activity "${newActivity.name}" was invalid.`
        );
      }

      // Validate Missions
      await logMissionProgress(newActivity, user);

      // Validate badges to be awarded based on the new activity
      if (isValid) {
        await evaluateActivityRelatedBadges(user, newActivity);
        evaluateDisciplineRelatedBadges(user, newActivity);
      }

      console.log('User : ', user.email);
    } catch (error) {
      next(error);
      return;
    }
  }

  console.log(
    '********************************** END *******************************'
  );

  res.status(200).send('EVENT_RECEIVED');
};

// Export the new endpoint
export { receivedHealthWorkouts };
