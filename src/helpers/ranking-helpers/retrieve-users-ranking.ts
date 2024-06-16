import prisma from '../prisma-client';

const retrieveUsersRanking = async (rankingLeagueId: string) => {
  try {
    const userList = await prisma.user.findMany({
      where: {
        league_id: rankingLeagueId,
      },
      orderBy: {
        current_week_score: 'desc',
      },
      include: {
        sport_type: true,
        user_clubs: {
          include: {
            club: {
              include: {
                sport_type: true,
              },
            },
          },
        },
        current_league: {
          include: { category: true },
        },
        user_badges: {
          include: { badge: true },
        },
      },
    });

    return userList;
  } catch (error) {
    throw error;
  }
};

//Exports
export { retrieveUsersRanking };
