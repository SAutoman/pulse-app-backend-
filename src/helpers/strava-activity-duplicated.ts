import prisma from './prisma-client';

const checkIfActivityExists = async (stravaActivityID: string) => {
  try {
    const activityFound = await prisma.activity.findFirst({
      where: { strava_id: stravaActivityID },
    });

    if (activityFound) {
      console.log(
        `Another activity with ID: ${activityFound.id} was found with the same Strava ID (${activityFound.strava_id})`
      );

      return true;
    }
    return false;
  } catch (error) {
    throw error;
  }
};

export { checkIfActivityExists };
