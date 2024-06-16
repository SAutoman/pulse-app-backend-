import { Activity, Mission, MissionAttempt, User } from '@prisma/client';
import prisma from './prisma-client';
import { DateTime } from 'luxon';
import { evaluateMissionBadge } from './badges-helpers/badges-evaluator-missions';

const logMissionProgress = async (activity: Activity, user: User) => {
  console.log(' ---- Validating Mission Progress -----');

  try {
    // Fetch all active mission attempts that match the activity's sport type and include their related missions
    const activeMissionAttempts = await prisma.missionAttempt.findMany({
      where: {
        user_id: activity.userId,
        status: 'ACTIVE',
        mission: {
          sport_type: {
            contains: activity.sport_type, // Case-insensitive containment check
            mode: 'insensitive',
          },
        },
      },
      include: {
        mission: true,
      },
    });

    // If there are no active missions for the user, do nothing
    if (!activeMissionAttempts.length) return;

    // Format the activity date for comparison
    const userTimezone = user.timezone.substring(12);
    const activityDateTimezoned = DateTime.fromISO(
      activity.start_date_user_timezone,
      { zone: userTimezone }
    );

    // Iterate over each mission attempt
    for (const attempt of activeMissionAttempts) {
      const currentMission = attempt.mission;

      // Format the attempt dates for comparison
      const attemptInitialDateTimezoned = DateTime.fromISO(
        attempt.start_date_user_timezone,
        { zone: userTimezone }
      );
      const attemptEndDateTimezoned = DateTime.fromISO(
        attempt.end_date_user_timezone,
        { zone: userTimezone }
      );

      // Validate if the activity date is within the mission attempt dates
      if (
        activityDateTimezoned >= attemptInitialDateTimezoned &&
        activityDateTimezoned <= attemptEndDateTimezoned
      ) {
        let increment: number = 0;

        switch (currentMission.goal_type) {
          case 'DISTANCE': // Meters
            increment = activity.distance / 1000;
            break;
          case 'FREQUENCY':
            increment = 1;
            break;
          case 'DURATION': // Seconds to minutes
            increment = activity.moving_time / 60;
            break;
          default:
            break;
        }

        if (increment > 0) {
          await prisma.$transaction(async (tx) => {
            // Create mission progress item
            await tx.missionProgress.create({
              data: {
                created_at: DateTime.utc().toISO()!,
                progress_made: increment,
                activity_id: activity.id,
                mission_attempt_id: attempt.id,
              },
            });

            // Increment mission attempt progress
            const updatedAttempt = await tx.missionAttempt.update({
              where: { id: attempt.id },
              data: {
                progress: attempt.progress + increment,
              },
              include: {
                mission: true,
              },
            });

            // Check if the mission attempt has been achieved
            if (updatedAttempt.progress >= updatedAttempt.mission.goal_value) {
              await tx.missionAttempt.update({
                where: { id: attempt.id },
                data: {
                  status: 'ACHIEVED',
                },
              });

              console.log(`Mission attempt ${attempt.id} achieved.`);
            }

            // Evaluate mission badges after updating progress and status
            await evaluateMissionBadge(user, updatedAttempt.mission);
          });
        }
      }
    }
  } catch (error) {
    console.error('Error logging mission progress:', error);
    throw error;
  }
};

// Exports
export { logMissionProgress };
