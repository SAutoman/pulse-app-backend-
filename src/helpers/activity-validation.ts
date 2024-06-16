import { Activity } from '@prisma/client';
import { DateTime } from 'luxon';
import prisma from './prisma-client';

/**
 * Validates an activity based on its creation time, average heart rate, and overlap with other activities.
 * The activity is deemed valid if all of the following conditions are met:
 * - It is uploaded in the same calendar week it was performed.
 * - The average heart rate during the activity is above a specified minimum threshold.
 * - The activity does not overlap in time with any existing activities of the same user within the same week.
 *
 * This function leverages the `isActivityOverlapping` function to check for time overlaps.
 *
 * @param {DateTime} createdAtUserTimezone - The creation date and time of the activity in the user's timezone, represented as a DateTime object.
 * @param {DateTime} stravaStartDateUserZone - The start date and time of the activity in the user's timezone, as recorded by Strava, represented as a DateTime object.
 * @param {number} average_heartrate - The average heart rate recorded during the activity.
 * @param {string} userId - The unique identifier of the user to whom the activity belongs.
 * @param {number} week_user_timezone - The week number in the user's timezone during which the activity is scheduled.
 * @param {string} start_date_epoch_ms - The start time of the activity, in milliseconds since the epoch, represented as a string.
 * @param {string} end_date_epoch_ms - The end time of the activity, also in milliseconds since the epoch, represented as a string.
 * @returns {Promise<Object>} An object containing:
 *  - `isValid` (boolean): True if the activity meets the validity conditions; otherwise, false.
 *  - `invalidMessage` (string|null): A descriptive message if the activity is invalid, or null if the activity is valid.
 */
const isActivityValid = async (
  createdAtUserTimezone: DateTime,
  stravaStartDateUserZone: DateTime,
  average_heartrate: number,
  userId: string,
  week_user_timezone: number,
  start_date_epoch_ms: string,
  end_date_epoch_ms: string
) => {
  let invalidMessage: string | null = null;
  let isOverlapping = false;

  const minHeartRate = 80;

  const isSameWeek =
    createdAtUserTimezone.weekNumber === stravaStartDateUserZone.weekNumber;

  const overHeartRateUmbral = average_heartrate >= minHeartRate;

  try {
    isOverlapping = await isActivityOverlapping(
      userId,
      week_user_timezone,
      start_date_epoch_ms,
      end_date_epoch_ms
    );
  } catch (error) {
    throw error;
  }
  if (isOverlapping) {
    invalidMessage =
      'The activity overlaps with another that you already have. You cannot have multiple activities loaded in the same period of time.';
  } else if (!isSameWeek) {
    invalidMessage =
      'The activity must be uploaded the same week it was performed';
  } else if (!overHeartRateUmbral) {
    invalidMessage = `The average heart rate must be above ${minHeartRate} bpm to be considered as excercise`;
  }

  return {
    isValid: isSameWeek && overHeartRateUmbral && !isOverlapping,
    invalidMessage,
  };
};

/**
 * Checks if a given activity, defined by start and end times, overlaps with any existing activities
 * for a specific user within the same week in their timezone. It leverages the Prisma client to query
 * the database for any existing activities that meet these overlap conditions.
 *
 * Overlapping is defined as any existing activity whose time range intersects with the time range of
 * the given activity. Specifically, an overlap occurs if the start time of one activity is before the
 * end time of another and the end time of the first activity is after the start time of the other.
 *
 * @param {string} userId - The unique identifier for the user to whom the activity belongs.
 * @param {number} week_user_timezone - The week number in the user's timezone during which the activity is scheduled.
 * @param {string} start_date_epoch_ms - The start date and time of the activity, represented as a string of milliseconds from the epoch.
 * @param {string} end_date_epoch_ms - The end date and time of the activity, also in milliseconds from the epoch as a string.
 * @returns {Promise<boolean>} A promise that resolves to `true` if an overlapping activity is found, otherwise `false`.
 */
const isActivityOverlapping: (
  userId: string,
  week_user_timezone: number,
  start_date_epoch_ms: string,
  end_date_epoch_ms: string
) => Promise<boolean> = async (
  userId: string,
  week_user_timezone: number,
  start_date_epoch_ms: string,
  end_date_epoch_ms: string
) => {
  try {
    const overlappingActivity = await prisma.activity.findFirst({
      where: {
        userId: userId,
        week_user_timezone: week_user_timezone,
        AND: [
          {
            start_date_epoch_ms: {
              lt: end_date_epoch_ms,
            },
          },
          {
            end_date_epoch_ms: {
              gt: start_date_epoch_ms,
            },
          },
        ],
      },
    });

    return overlappingActivity !== null;
  } catch (error) {
    throw error;
  }
};

//Exports
export { isActivityValid };
