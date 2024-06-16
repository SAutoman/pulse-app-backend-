import { Activity, User } from '@prisma/client';
import prisma from '../helpers/prisma-client';
import { DateTime } from 'luxon';
import { calculatePoints } from './points-calculator';

const incrementUserScoreBasedOnActivity = async (
  activity: Activity,
  user: User
) => {
  //Get user Zone
  const userZone = user.timezone;
  const formattedZone = userZone.substring(12);

  //Format activity date to include the score in the correct period
  const activityDate = DateTime.fromISO(activity.created_at);
  const activityDateUserZone = activityDate.setZone(formattedZone);
  const activityYear = activityDateUserZone.year;
  //const activityMonth = activityDateUserZone.month;
  const activityWeek = activityDateUserZone.weekNumber;

  // Format the date as 'YYYY-WW'
  const formattedDate = `${activityYear}-${activityWeek
    .toString()
    .padStart(2, '0')}`;

  const weekly_scores = (user.weekly_scores as { [key: string]: number }) || {};

  //Calculate the total points based on the existing activities (for that week)
  try {
    const totalPointsWeek = await prisma.activity.aggregate({
      where: {
        userId: user.id,
        week_user_timezone: activity.week_user_timezone,
        is_valid: true
      },
      _sum: {
        calculated_points: true,
      },
    });
    weekly_scores[formattedDate] = totalPointsWeek._sum.calculated_points ?? 0;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        weekly_scores: weekly_scores,
        current_week_score: totalPointsWeek._sum.calculated_points ?? 0,
      },
    });
    console.log('New Score: ', updatedUser.weekly_scores);
  } catch (error) {
    throw error;
  }
};

export { incrementUserScoreBasedOnActivity };
