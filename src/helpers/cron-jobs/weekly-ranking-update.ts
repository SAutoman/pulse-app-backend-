import { DateTime } from 'luxon';
import cron from 'node-cron';
import prisma from '../prisma-client';
import { RankingLeague, User } from '@prisma/client';
import { createUserNotification } from '../create-user-notification';
import { evaluateRankingBadge } from '../badges-helpers/badges-evaluator-ranking';

const cronEndOfWeek = () => {
  cron.schedule(
    '59 59 23 * * 0',
    async () => {
      console.log('CRON Job just ran!', DateTime.now().toISO());

      try {
        const leagues = await prisma.rankingLeague.findMany({
          include: { category: true },
          orderBy: [{ category: { order: 'asc' } }, { level: 'asc' }],
        });

        for (const league of leagues) {
          const users = await prisma.user.findMany({
            where: { league_id: league.id },
            orderBy: { current_week_score: 'desc' },
          });

          const promotionThreshold = 3; // Promote top 3
          const relegationThreshold = users.length - 3; // Relegate bottom 3

          const usersToPromote = users.slice(0, promotionThreshold);
          const usersToRelegate = users.slice(relegationThreshold);
          const usersToRemain = users.slice(
            promotionThreshold,
            relegationThreshold
          );

          // Printing user emails for each category
          console.log(
            'Users to Promote:',
            usersToPromote.map((user) => user.email).join(', ')
          );
          console.log(
            'Users to Relegate:',
            usersToRelegate.map((user) => user.email).join(', ')
          );
          console.log(
            'Users to Remain:',
            usersToRemain.map((user) => user.email).join(', ')
          );

          await updateRankings(usersToPromote, 'promote', league);
          await updateRankings(usersToRelegate, 'relegate', league);
          await updateRankings(usersToRemain, 'remain', league);
        }
      } catch (error) {
        console.error('Error during the CRON job for ranking updates:', error);
      }
    },
    {
      timezone: 'America/Bogota',
    }
  );
};

// Type for including category within the league data
interface FullLeague extends RankingLeague {
  category: {
    id: string;
    name: string;
    order: number;
  };
}

const updateRankings = async (
  users: User[],
  type: 'promote' | 'relegate' | 'remain',
  currentLeague: FullLeague
) => {
  for (const user of users) {
    const newCoins = user.coins + user.current_week_score;

    let newLeagueId = currentLeague.id; // Default: stay in the current league
    let newCategoryId = currentLeague.category_id; // Default: stay in the current category
    let newCategoryName = currentLeague.category.name; // Default: stay in the current category name
    let newLeagueLevel = currentLeague.level; // Default: stay in the current league level
    let notificationTitle = '';
    let notificationMessage = '';

    // Handling promotion scenarios
    if (type === 'remain') {
      notificationTitle = 'League Unchanged';
      notificationMessage = `You remain in ${currentLeague.category.name} Category, League ${currentLeague.level}.`;
    } else {
      if (type === 'promote') {
        if (currentLeague.level === 1) {
          // Check for promotion to a higher category
          const higherCategory = await prisma.rankingCategory.findFirst({
            where: { order: currentLeague.category.order - 1 },
            include: { leagues: { orderBy: { level: 'desc' } } },
          });
          if (higherCategory && higherCategory.leagues.length > 0) {
            newLeagueId = higherCategory.leagues[0].id;
            newCategoryId = higherCategory.id;
            newCategoryName = higherCategory.name;
            newLeagueLevel = higherCategory.leagues[0].level;
            notificationTitle = 'Promotion Notification';
            notificationMessage = `You have been promoted to ${newCategoryName} Category, League ${newLeagueLevel}.`;
          }
        } else {
          // Promotion within the same category
          const higherLeague = await prisma.rankingLeague.findFirst({
            where: {
              category_id: currentLeague.category_id,
              level: currentLeague.level - 1,
            },
          });
          if (higherLeague) {
            newLeagueId = higherLeague.id;
            newLeagueLevel = higherLeague.level;
            notificationTitle = 'Promotion Notification';
            notificationMessage = `You have been promoted to League ${newLeagueLevel} within the same category.`;
          }
        }
      } else if (type === 'relegate') {
        // Handling relegation scenarios
        const maxLevel = await prisma.rankingLeague.findMany({
          where: { category_id: currentLeague.category_id },
          orderBy: { level: 'desc' },
          take: 1,
        });
        const lowestLeagueLevel = maxLevel[0].level;
        if (currentLeague.level === lowestLeagueLevel) {
          // Check for relegation to a lower category
          const lowerCategory = await prisma.rankingCategory.findFirst({
            where: { order: currentLeague.category.order + 1 },
            include: { leagues: { orderBy: { level: 'asc' } } },
          });
          if (lowerCategory && lowerCategory.leagues.length > 0) {
            newLeagueId = lowerCategory.leagues[0].id;
            newCategoryId = lowerCategory.id;
            newCategoryName = lowerCategory.name;
            newLeagueLevel = lowerCategory.leagues[0].level;
            notificationTitle = 'Relegation Notification';
            notificationMessage = `You have been relegated to ${newCategoryName} Category, League ${newLeagueLevel}.`;
          }
        } else {
          // Relegation within the same category
          const lowerLeague = await prisma.rankingLeague.findFirst({
            where: {
              category_id: currentLeague.category_id,
              level: currentLeague.level + 1,
            },
          });
          if (lowerLeague) {
            newLeagueId = lowerLeague.id;
            newLeagueLevel = lowerLeague.level;
            notificationTitle = 'Relegation Notification';
            notificationMessage = `You have been relegated to League ${newLeagueLevel} within the same category.`;
          }
        }
      }
    }

    // Print the current and new league/category details
    console.log(`User: ${user.email}`);
    console.log(`${type.toUpperCase()}`);
    console.log(
      `Current Category: ${currentLeague.category.name}, Level: ${currentLeague.level}`
    );
    console.log(`New Category: ${newCategoryName}, Level: ${newLeagueLevel}`);
    console.log(`------------`);

    //Update user record in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        league_id: newLeagueId,
        coins: newCoins,
        current_week_score: 0,
      },
    });

    // Create a coin transaction to reflect the conversion of weekly points to coins
    await prisma.coinTransaction.create({
      data: {
        user_id: user.id,
        amount: user.current_week_score,
        type: 'WEEKLY_POINTS',
        description: `Weekly points conversion to coins`,
        created_at_epoch_ms: new Date().getTime().toString(),
      },
    });

    //Evaluate RANKING badges AFTER the rankings have been updated
    await evaluateRankingBadge(user);

    // Create user notification
    createUserNotification(
      user,
      1,
      type.toUpperCase(),
      notificationMessage,
      notificationTitle
    );
  }
};

export { cronEndOfWeek };
