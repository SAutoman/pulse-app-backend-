import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checks if the user has all the prerequisite badges uniquely.
 * @param user_id The ID of the user to check.
 * @param prerequisites An array of badge IDs that are prerequisites.
 * @returns Promise<boolean> True if the user has all the prerequisites, false otherwise.
 */
export const hasAllPrerequisiteBadges = async (
  user_id: string,
  prerequisites: string[]
): Promise<boolean> => {
  const userBadges = await prisma.userBadge.findMany({
    where: {
      user_id,
      badge_id: { in: prerequisites },
    },
    select: {
      badge_id: true,
    },
  });

  // Create a set to store unique badge IDs from the user's badges
  const uniqueUserBadgeIds = new Set(userBadges.map((badge) => badge.badge_id));

  // Check if every prerequisite badge ID is in the set of unique user badge IDs
  return prerequisites.every((prerequisite) =>
    uniqueUserBadgeIds.has(prerequisite)
  );
};
