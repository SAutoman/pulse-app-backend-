import { PrismaClient, User, Activity } from '@prisma/client';
import { evaluateDisciplineBadge } from './badges-evaluator-discipline';

const prisma = new PrismaClient();

/**
 * Evaluate all relevant discipline badges for a given activity.
 * @param user User who performed the activity.
 * @param activity Activity details that may trigger badge awards.
 */
export const evaluateDisciplineRelatedBadges = async (
  user: User,
  activity: Activity
) => {
  console.log(' ---- Evaluating DISCIPLINE Badges -----');

  try {
    const badgesToEvaluate = await prisma.badge.findMany({
      where: {
        type: 'DISCIPLINE',
        OR: [
          { sport_types: { has: activity.sport_type } },
          { sport_types: { has: 'All' } },
        ],
      },
    });

    console.log(`Discipline Badges to Evaluate: ${badgesToEvaluate.length}`);

    for (const badge of badgesToEvaluate) {
      evaluateDisciplineBadge(user, badge)
        .then((isAwarded) => {
          if (isAwarded) {
            console.log(
              `Discipline badge '${badge.name}' awarded to ${user.email}`
            );
            // Optionally create a notification or handle the badge awarding process
          }
        })
        .catch((error) => {
          console.error(
            `Failed to evaluate discipline badge '${badge.name}':`,
            error
          );
        });
    }
  } catch (error) {
    console.error('Failed to fetch discipline badges or evaluate them:', error);
    throw error;
  }
};
