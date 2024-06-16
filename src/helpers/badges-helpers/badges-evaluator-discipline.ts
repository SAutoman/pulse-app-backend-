import { PrismaClient, User, Badge, Activity } from '@prisma/client';
import { DateTime } from 'luxon';
import { createUserNotification } from '../create-user-notification';
import { hasAllPrerequisiteBadges } from './badges-prerequisites-check';

const prisma = new PrismaClient();

interface IDisciplineCriteria {
  numberOfWeeks?: number;
  minActivities?: number;
}

/**
 * Evaluates whether a user qualifies for a "DISCIPLINE" type badge based on activity registration frequency.
 * @param user User object whose activities to evaluate.
 * @param badge Badge object containing the discipline criteria.
 * @returns Promise<boolean> True if the badge is awarded, false otherwise.
 */
export const evaluateDisciplineBadge = async (
  user: User,
  badge: Badge
): Promise<boolean> => {
  try {
    // Check that the badge has the correct type
    if (badge.type !== 'DISCIPLINE') {
      console.log(
        `The badge is not validated by this function as its type is ${badge.type}`
      );
      return false;
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
      return false; // User already has the badge
    }

    // Verify prerequisites
    if (badge.prerequisites?.length > 0) {
      const hasPrerequisites = await hasAllPrerequisiteBadges(
        user.id,
        badge.prerequisites
      );
      if (!hasPrerequisites) {
        console.log('User does not meet all prerequisite badges.');
        return false;
      }
    }

    const criteria: IDisciplineCriteria = badge.criteria as IDisciplineCriteria;
    const formattedUserZone = user.timezone.substring(12);

    // Calculate the date range to evaluate
    const untilDate = DateTime.now().endOf('week').setZone(formattedUserZone);
    const fromDate = untilDate
      .minus({ weeks: (criteria.numberOfWeeks ?? 1) - 1 })
      .startOf('week');

    console.log('From Date', fromDate.toISO());
    console.log('Until Date', untilDate.toISO());

    const activities = await prisma.activity.findMany({
      where: {
        is_valid: true,
        userId: user.id,
        start_date_user_timezone: {
          gte: fromDate.toISO()!,
          lte: untilDate.toISO()!,
        },
        ...(badge.sport_types.includes('All')
          ? {}
          : { type: { in: badge.sport_types } }),
      },
      orderBy: {
        start_date_user_timezone: 'asc',
      },
    });

    const isAwarded = evaluateWeeklyActivities(
      activities,
      criteria,
      fromDate,
      untilDate
    );

    if (isAwarded) {
      // Create the user badge relation
      await prisma.userBadge.create({
        data: {
          user_id: user.id,
          badge_id: badge.id,
          date_earned_epoch_ms: new Date().getTime().toString(),
        },
      });

      // Create notification to the user
      await createUserNotification(
        user,
        2,
        'NEW_BADGE',
        `You have earned a new badge: ${badge.name}`,
        `New badge earned for discipline!`
      );

      console.log(`Discipline badge '${badge.name}' awarded to ${user.email}`);
    }

    return isAwarded;
  } catch (error) {
    console.error('Failed to evaluate discipline badge:', error);
    return false;
  }
};

function evaluateWeeklyActivities(
  activities: Activity[],
  criteria: IDisciplineCriteria,
  fromDate: DateTime,
  untilDate: DateTime
): boolean {
  // Define 'weeks' with an index signature
  const weeks: { [key: number]: number } = {};

  activities.forEach((activity) => {
    const weekNumber = DateTime.fromISO(
      activity.start_date_user_timezone
    ).weekNumber;
    // Initialize or increment the activity count for the given week
    weeks[weekNumber] = (weeks[weekNumber] || 0) + 1;
  });

  console.log(weeks);

  // Check if the user has the required number of activities for each week in the period
  let consecutiveWeeks = 0;
  for (let i = fromDate.weekNumber; i <= untilDate.weekNumber; i++) {
    if ((weeks[i] ?? 0) >= (criteria.minActivities ?? 0)) {
      consecutiveWeeks++;
    } else {
      consecutiveWeeks = 0;
    }

    if (consecutiveWeeks >= (criteria.numberOfWeeks ?? 0)) {
      return true;
    }
  }
  console.log(consecutiveWeeks,criteria.numberOfWeeks);
  return false;
}
