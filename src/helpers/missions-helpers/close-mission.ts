import prisma from '../prisma-client';

export const finalizeMission = async (missionId: string) => {
  // Step 1: Set the mission's is_active to false
  const mission = await prisma.mission.update({
    where: {
      id: missionId,
    },
    data: {
      is_active: false,
    },
  });

  if (!mission) {
    throw new Error('Mission not found');
  }

  // Step 2: Retrieve all mission attempts related to this mission
  const missionAttempts = await prisma.missionAttempt.findMany({
    where: {
      mission_id: missionId,
    },
  });

  // Step 3: Iterate through each mission attempt and update its status
  await Promise.all(
    missionAttempts.map(async (attempt) => {
      const newStatus =
        attempt.progress >= mission.goal_value ? 'ACHIEVED' : 'NOT_ACHIEVED';
      await prisma.missionAttempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          status: newStatus,
        },
      });
    })
  );

  console.log('Mission and its attempts have been finalized.');
};
