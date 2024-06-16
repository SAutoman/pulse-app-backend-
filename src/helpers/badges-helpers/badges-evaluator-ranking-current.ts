import { PrismaClient, User, Badge, UserBadge } from '@prisma/client';
import { ICriteria } from './badges-evaluator-distance';
import { createUserNotification } from '../create-user-notification';
import { hasAllPrerequisiteBadges } from './badges-prerequisites-check';

const prisma = new PrismaClient();

interface RankingEvaluationResult {
  meetsCriteria: string;
}
/**
 * Validates if the user qualifies for any badges based on their current ranking league.
 * It fetches all badges, then checks each one to see if its criteria match the user's ranking league.
 * @param user User object to evaluate.
 * @returns Promise<boolean> True if there is a qualifying badge the user hasn't received, false otherwise.
 */
export const evaluateCurrentRankingBadge = async (user: User): Promise<RankingEvaluationResult> => {
  console.log(' ---- Evaluating RANKING Badges -----');
  try {
    if (!user.league_id) {
      console.log('User does not have a current league.');
      return {meetsCriteria: 'false'};
    }

    // Fetch all badges
    const badges = await prisma.badge.findMany();

    for (const badge of badges) {
      // Attempt to parse criteria and check for the rankingLeagueId
      try {
        const criteria = badge.criteria as ICriteria;
        console.log(criteria);
        if (criteria.rankingLeagueId !== user.league_id) {
          continue; // Skip this badge if the league ID does not match
        }

        // Check if the user already has this badge
        const badgeOwned = await prisma.userBadge.findFirst({
          where: {
            user_id: user.id,
            badge_id: badge.id,
          },
        });

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

        if (!badgeOwned && badge.type === 'RANKING') {
          console.log(
            `User qualifies for badge: ${badge.name} based on league: ${user.league_id}`
          );



          return {meetsCriteria: 'false'};
        }
      } catch (error) {
        // Handle JSON parsing errors or missing criteria field
        console.error('Error parsing badge criteria:', error);
      }
    }

    console.log(
      'No new badges available for the user based on current ranking league.'
    );
    return {meetsCriteria: 'true'};
  } catch (error) {
    console.error('Failed to validate ranking based badges:', error);
    return {meetsCriteria: 'false'};
  }
};
