import { PrismaClient, User, Mission, Badge, UserBadge } from '@prisma/client';
import { createUserNotification } from '../create-user-notification';
import { ICriteria } from './badges-evaluator-distance';
import { hasAllPrerequisiteBadges } from './badges-prerequisites-check';

const prisma = new PrismaClient();

interface MissionEvaluationResult {
  meetsCriteria: string;
}
/**
 * Evaluates and potentially awards a "MISSION" type badge to a user if they have completed a specific mission.
 * This version fetches all badges of type "MISSION" and manually filters them based on criteria.
 * @param user User object to evaluate.
 * @param mission Mission object related to the badge criteria.
 * @returns Promise<boolean> True if the badge is awarded, false otherwise.
 */
export const evaluateCurrentMissionBadge = async (
  user: User,
  mission: Mission
): Promise<MissionEvaluationResult> => {
  console.log(' ---- Evaluating MISSION Badges -----');

  try {
    // Fetch all badges with type 'MISSION'
    const badges = await prisma.badge.findMany({
      where: {
        type: 'MISSION',
      },
    });

    let badgeAwarded = false;
    for (const badge of badges) {
      // Parse the badge's criteria JSON to check for missionId
      const criteria = badge.criteria as ICriteria;
      if (criteria.missionId !== mission.id) {
        continue; // Skip this badge if the mission ID does not match
      }

      // Check if the user already has this badge
      const existingBadge = await prisma.userBadge.findFirst({
        where: {
          user_id: user.id,
          badge_id: badge.id,
        },
      });

      if (existingBadge) {
        console.log(`User already has badge: ${badge.name}`);
        continue; // Skip to the next badge if already awarded
      }

      // Check if the user has all the prerequisite badges
      if (badge.prerequisites && badge.prerequisites.length > 0) {
        const hasPrerequisites = await hasAllPrerequisiteBadges(
          user.id,
          badge.prerequisites
        );
        if (!hasPrerequisites) {
          console.log('User does not have all the prerequisite badges.');
          return {meetsCriteria: 'false'};
        }
      }

      // Check if there is an achieved mission attempt for this badge's mission
      const missionAttempt = await prisma.missionAttempt.findFirst({
        where: {
          user_id: user.id,
          mission_id: mission.id,
          status: 'ACHIEVED', // Only consider attempts marked as "ACHIEVED"
        },
      });

      if (missionAttempt) {
        // Award the badge since the mission was achieved
        console.log(
          `Awarded badge: ${badge.name} to user for completing mission: ${mission.name}`
        );
        badgeAwarded = true;
      }
    }

    if (!badgeAwarded) {
      console.log(
        'No badges awarded; conditions not met or badge already owned.'
      );
    }
    // return badgeAwarded; // Return true if any badge was awarded
    if(badgeAwarded == false) {
      return {meetsCriteria: 'true'};
    }
    else {
      return {meetsCriteria: 'false'};
    }
  } catch (error) {
    console.error('Failed to evaluate or award mission badge:', error);
    return {meetsCriteria: 'false'};
  }
};
