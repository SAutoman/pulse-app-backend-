import { PrismaClient, User, Badge, Activity } from '@prisma/client';
import { DateTime } from 'luxon';
import { createUserNotification } from '../create-user-notification';
import { hasAllPrerequisiteBadges } from './badges-prerequisites-check';

const prisma = new PrismaClient();

interface IDisciplineCriteria {
  numberOfWeeks?: number;
  minActivities?: number;
}

interface DisciplineEvaluationResult {
  meetsCriteria: string;
  consecutiveWeeks: number;
  requiredWeeks: number;
}

/**
 * Evaluates whether a user qualifies for a "DISCIPLINE" type badge based on activity registration frequency.
 * @param user User object whose activities to evaluate.
 * @param badge Badge object containing the discipline criteria.
 * @returns Promise<DisciplineEvaluationResult> Object containing whether the user meets the criteria,
 * consecutive weeks, and required weeks.
 */
export const evaluateCurrentDisciplineBadge = async (
  user: User,
  badge: Badge
): Promise<DisciplineEvaluationResult> => {
  try {
    // Check that the badge has the correct type
    if (badge.type !== 'DISCIPLINE') {
      console.log(
        `The badge is not validated by this function as its type is ${badge.type}`
      );
      return { meetsCriteria: 'false', consecutiveWeeks: 0, requiredWeeks: 0 };
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
      return { meetsCriteria: 'false', consecutiveWeeks: 0, requiredWeeks: 0 }; // User already has the badge
    }

    // Verify prerequisites
    if (badge.prerequisites?.length > 0) {
      const hasPrerequisites = await hasAllPrerequisiteBadges(
        user.id,
        badge.prerequisites
      );
      if (!hasPrerequisites) {
        console.log('User does not meet all prerequisite badges.');
        return { meetsCriteria: 'false', consecutiveWeeks: 0, requiredWeeks: 0 };
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

    const {
      meetsCriteria,
      consecutiveWeeks,
      requiredWeeks,
    } = evaluateWeeklyActivities(activities, criteria, fromDate, untilDate);

    if (meetsCriteria == 'true') {
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

    return { meetsCriteria, consecutiveWeeks, requiredWeeks };
  } catch (error) {
    console.error('Failed to evaluate discipline badge:', error);
    return { meetsCriteria: 'false', consecutiveWeeks: 0, requiredWeeks: 0 };
  }
};

function evaluateWeeklyActivities(
  activities: Activity[],
  criteria: IDisciplineCriteria,
  fromDate: DateTime,
  untilDate: DateTime
): DisciplineEvaluationResult {
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
      return { meetsCriteria: 'true', consecutiveWeeks, requiredWeeks: criteria.numberOfWeeks ?? 0 };
    }
  }
  console.log(consecutiveWeeks, criteria.numberOfWeeks);
  return { meetsCriteria: 'false', consecutiveWeeks, requiredWeeks: criteria.numberOfWeeks ?? 0 };
}