import { PrismaClient, User, Activity } from '@prisma/client';
import { evaluateTimeBadge } from './badges-evaluator-time';
import { evaluateDistanceBadge } from './badges-evaluator-distance';

const prisma = new PrismaClient();

/**
 * Evaluate all relevant badges for a given activity.
 * @param user User who performed the activity.
 * @param activity Activity details that may trigger badge awards.
 */
export const evaluateActivityRelatedBadges = async (
  user: User,
  activity: Activity
) => {
  console.log(' ---- Evaluating TIME/DISTANCE Badges -----');

  try {
    const badgesToEvaluate = await prisma.badge.findMany({
      where: {
        type: { in: ['TIME', 'DISTANCE'] },
        OR: [
          { sport_types: { has: activity.sport_type } },
          { sport_types: { has: 'All' } },
        ],
      },
    });

    console.log(`Time/Distance Badges to Evaluate: ${badgesToEvaluate.length}`);

    for (const badge of badgesToEvaluate) {
      if (badge.type === 'TIME' && activity.elapsed_time) {
        evaluateTimeBadge(user, badge)
          .then((isAwarded) => {
            if (isAwarded) {
              console.log(
                `Time badge '${badge.name}' awarded to ${user.email}`
              );
              // Optionally create a notification or handle the badge awarding process
            }
          })
          .catch((error) => {
            console.error(
              `Failed to evaluate time badge '${badge.name}':`,
              error
            );
          });
      } else if (badge.type === 'DISTANCE' && activity.distance) {
        evaluateDistanceBadge(user, badge)
          .then((isAwarded) => {
            if (isAwarded) {
              console.log(
                `Distance badge '${badge.name}' awarded to ${user.email}`
              );
              // Optionally create a notification or handle the badge awarding process
            }
          })
          .catch((error) => {
            console.error(
              `Failed to evaluate distance badge '${badge.name}':`,
              error
            );
          });
      }
      // Add additional conditions for other badge types if necessary
    }
  } catch (error) {
    console.error('Failed to fetch badges or evaluate them:', error);
    throw error;
  }
};
