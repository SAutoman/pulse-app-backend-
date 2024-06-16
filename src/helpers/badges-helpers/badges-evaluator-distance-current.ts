import { PrismaClient, User, Badge, UserBadge } from '@prisma/client';
import { DateTime } from 'luxon';
import { hasAllPrerequisiteBadges } from './badges-prerequisites-check';
import { createUserNotification } from '../create-user-notification';

const prisma = new PrismaClient();

export interface ICriteria {
  minMetersDistance?: number;
  minMinutes?: number;
  rankingLeagueId?: string;
  missionId?: string;
}

export interface EvaluationResult {
  meetsCriteria: string;
  totalDistance: number;
  criteriaDistance: number;
}

/**
 * Fetches all activities for a given user and evaluates them based on whether the total distance
 * covered meets the badge's distance criteria within the defined active period.
 * Awards the badge if criteria are met and notifies the user.
 * @param user User object whose activities to evaluate.
 * @param badge Badge object containing criteria, sport types, prerequisites, and active period.
 * @returns Promise<EvaluationResult> Object containing whether the user meets the criteria,
 * total distance, and the criteria distance.
 */
export const evaluateCurrentDistanceBadge = async (
  user: User,
  badge: Badge
): Promise<EvaluationResult> => {
  try {
    const criteria: ICriteria = badge.criteria as ICriteria;

    if (badge.type !== 'DISTANCE') {
      console.log(
        `Badge type mismatch. Expected 'DISTANCE', got '${badge.type}'`
      );
      return { meetsCriteria: 'false', totalDistance: 0, criteriaDistance: criteria.minMetersDistance || 0 };
    }

    // Check if the user already has this badge
    const existingBadge = await prisma.userBadge.findFirst({
      where: {
        user_id: user.id,
        badge_id: badge.id,
      },
    });

    if (existingBadge) {
      console.log(`User already has the badge: ${badge.name}`);
      return { meetsCriteria: 'false', totalDistance: 0, criteriaDistance: criteria.minMetersDistance || 0 }; // User already has the badge
    }

    // Verify prerequisites
    if (badge.prerequisites?.length > 0) {
      const hasPrerequisites = await hasAllPrerequisiteBadges(
        user.id,
        badge.prerequisites
      );
      if (!hasPrerequisites) {
        console.log('User does not meet all prerequisite badges.');
        return { meetsCriteria: 'false', totalDistance: 0, criteriaDistance: criteria.minMetersDistance || 0 };
      }
    }

    const formattedUserZone = user.timezone.substring(12);
    const fromDateTime = DateTime.fromISO(badge.available_from)
      .startOf('day')
      .setZone(formattedUserZone);
    const untilDateTime = DateTime.fromISO(badge.available_until)
      .endOf('day')
      .setZone(formattedUserZone);

    const activities = await prisma.activity.findMany({
      where: {
        is_valid: true,
        userId: user.id,
        AND: [
          {
            start_date_user_timezone: {
              gte: fromDateTime.toISO()!,
              lte: untilDateTime.toISO()!,
            },
          },
          badge.sport_types.includes('All')
            ? {}
            : { type: { in: badge.sport_types } },
        ],
      },
      select: { distance: true },
    });

    const totalDistance = activities.reduce(
      (sum, activity) => sum + (activity.distance || 0),
      0
    );

    if (totalDistance >= (criteria.minMetersDistance || 0)) {
      // Create the badge award
      await prisma.userBadge.create({
        data: {
          user_id: user.id,
          badge_id: badge.id,
          date_earned_epoch_ms: DateTime.now().toMillis().toString(),
        },
      });

      // Send notification
      await createUserNotification(
        user,
        2, // Importance level
        'NEW_BADGE',
        `Congratulations! You've earned the ${badge.name} badge.`,
        `You achieved the ${badge.name} badge for covering ${totalDistance} meters in activities.`
      );

      console.log(`Badge '${badge.name}' awarded to ${user.email}`);
      return { meetsCriteria: 'false', totalDistance, criteriaDistance: criteria.minMetersDistance || 0 };
    }

    console.log(`Criteria not met for badge '${badge.name}'`);
    return { meetsCriteria: 'true', totalDistance, criteriaDistance: criteria.minMetersDistance || 0 };
  } catch (error) {
    console.error('Failed to evaluate distance badge:', error);
    return { meetsCriteria: 'false', totalDistance: 0, criteriaDistance: 0 };
  }
};