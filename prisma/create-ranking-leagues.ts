import prisma from '../src/helpers/prisma-client';

/**
 * Populates the `rankingLeague` table with default league entries for each category.
 *
 * This function retrieves all categories ordered by their 'order' field in ascending order.
 * It then iterates over each category and creates four leagues for each one. These leagues
 * are distinguished by their 'level' ranging from 1 to 4.
 *
 * The function aims to initialize the database with a predefined structure of leagues
 * for each category to facilitate further operations or data entry within the application.
 * */
const createRankingLeagues = async () => {
  const result = await prisma.rankingCategory.findMany({
    orderBy: { order: 'asc' },
  });

  for (const category of result) {
    for (let index = 1; index <= 4; index++) {
      await prisma.rankingLeague.create({
        data: {
          level: index,
          category_id: category.id,
        },
      });
    }
  }

  console.log('Update Ran in MongoDB');
  console.log(result);
};

// createRankingLeagues();

/**
 * Assigns a ranking league to each user based on their current 'league' level and 'category'.
 *
 * This function iterates over all users, finding the appropriate ranking league that matches
 * each user's current league level and category name. It then assigns this league to the user.
 * This is crucial for synchronizing or initializing user rankings after league restructuring.
 * */
// const assignRankingLeaguesToUsers = async () => {
//   try {
//     const result = await prisma.user.findMany({});

//     for (const user of result) {
//       const league = await prisma.rankingLeague.findFirst({
//         where: {
//           level: user.league,
//           category: {
//             name: user.category,
//           },
//         },
//       });

//       if (league) {
//         // Assuming 'email' is used as a unique identifier; adjust as needed.
//         await prisma.user.update({
//           where: { id: user.id },
//           data: { league_id: league.id },
//         });
//         console.log(`User ${user.email} assigned to League ${league.level}`);
//       } else {
//         console.log(
//           `No matching league found for User ${user.email} in Category ${user.category}`
//         );
//       }
//     }

//     console.log('Update Ran in MongoDB');
//     console.log(result);
//   } catch (error) {
//     console.error('Failed to assign ranking leagues to users:', error);
//   }
// };

// assignRankingLeaguesToUsers();

//Should run: npx ts-node prisma/create-ranking-leagues.ts
