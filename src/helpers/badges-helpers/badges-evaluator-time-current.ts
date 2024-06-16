import { PrismaClient, User, Badge, UserBadge } from '@prisma/client';
import { DateTime } from 'luxon';
import { ICriteria } from './badges-evaluator-distance';
import { hasAllPrerequisiteBadges } from './badges-prerequisites-check';
import { createUserNotification } from '../create-user-notification';

const prisma = new PrismaClient();

interface TimeBadgeEvaluationResult {
  meetsCriteria: string;
  totalMinutes: number;
  criteriaMinutes: number;
}

/**
 * Evaluates time-based badges for a user based on the total elapsed time of relevant activities.
 * @param user User whose activities are to be evaluated.
 * @param badge Badge to evaluate against.
 * @returns Promise<TimeBadgeEvaluationResult> Object indicating if the badge was awarded and including the total minutes and criteria minutes.
 */
export const evaluateCurrentTimeBadge = async (
  user: User,
  badge: Badge
): Promise<TimeBadgeEvaluationResult> => {
  try {
    const criteria = badge.criteria as ICriteria;

    if (badge.type !== 'TIME') {
      console.log(`Badge type mismatch. Expected 'TIME', got '${badge.type}'`);
      return { meetsCriteria: 'false', totalMinutes: 0, criteriaMinutes: criteria.minMinutes ?? 0 };
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
      return { meetsCriteria: 'false', totalMinutes: 0, criteriaMinutes: criteria.minMinutes ?? 0 };
    }

    // Verify prerequisites
    if (badge.prerequisites?.length > 0) {
      const hasPrerequisites = await hasAllPrerequisiteBadges(
        user.id,
        badge.prerequisites
      );
      if (!hasPrerequisites) {
        console.log('User does not meet all prerequisite badges.');
        return { meetsCriteria: 'false', totalMinutes: 0, criteriaMinutes: criteria.minMinutes ?? 0 };
      }
    }

    // Set time boundaries for activity fetching
    const formattedUserZone = user.timezone.substring(12);
    const fromDateTime = DateTime.fromISO(badge.available_from)
      .startOf('day')
      .setZone(formattedUserZone);
    const untilDateTime = DateTime.fromISO(badge.available_until)
      .endOf('day')
      .setZone(formattedUserZone);

    // Fetch relevant activities
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
      select: {
        elapsed_time: true,
      },
    });

    const totalMinutes = activities.reduce(
      (sum, activity) => sum + activity.elapsed_time / 60,
      0
    );

    const criteriaMinutes = criteria.minMinutes ?? 0;

    if (totalMinutes >= criteriaMinutes) {
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
        `You achieved the ${badge.name} badge for accumulating ${totalMinutes} minutes of activity.`
      );

      console.log(`Badge '${badge.name}' awarded to ${user.email}`);
      return { meetsCriteria: 'false', totalMinutes, criteriaMinutes };
    }

    console.log(`Criteria not met for badge '${badge.name}'`);
    return { meetsCriteria: 'true', totalMinutes, criteriaMinutes };
  } catch (error) {
    console.error('Failed to evaluate time badge:', error);
    return { meetsCriteria: 'false', totalMinutes: 0, criteriaMinutes: 0 };
  }
};