import { Activity } from '@prisma/client';
import prisma from './prisma-client';

//Calculate one activity points (New calculation)
const calculatePoints = (average_heartrate: number, moving_time: number) => {

  //Calculate the MET - metabolic equivalent of task -> Effort factor
  let effortFactor: number;

  if (average_heartrate < 114) {
    effortFactor = 1.23; // Very Light
  } else if (average_heartrate <= 122) {
    effortFactor = 1.84; // Light
  } else if (average_heartrate <= 144) {
    effortFactor = 2.19; // Moderate
  } else if (average_heartrate <= 156) {
    effortFactor = 2.6; // Vigorous
  } else if (average_heartrate <= 169) {
    effortFactor = 2.94; // Hard
  } else {
    effortFactor = 3.48; // Maximum Effort
  }

  //Time in hours (moving time is in seconds)
  let timeInHours = moving_time / 3600;

  //70 is the factor representing the average weight of a person
  const points = Math.ceil(effortFactor * average_heartrate * timeInHours);

  return { points, effortFactor };
};

//Calculate multiple activities points

const reCalculateActivitiesPoints = async (activities: Activity[]) => {
  let totalPoints = 0;

  for (const activity of activities) {
    const { points, effortFactor } = calculatePoints(
      activity.average_heartrate ?? 0,
      activity.moving_time
    );
    console.log(activity.id, activity.name, effortFactor, points);

    //Update activity info
    await prisma.activity.update({
      where: { id: activity.id },
      data: { calculated_points: points, calculated_met: effortFactor },
    });

    totalPoints = totalPoints + points;
  }

  return totalPoints;
};

export { calculatePoints, reCalculateActivitiesPoints };
