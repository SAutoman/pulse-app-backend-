import cron from 'node-cron';
import prisma from '../prisma-client';
import { finalizeMission } from '../missions-helpers/close-mission';

// Daily cron job
export const cronDailyMissionClose = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily check for ended missions');

    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const endedMissions = await prisma.mission.findMany({
      where: {
        end_day: {
          lte: today,
        },
        is_active: true, // Consider only active missions
      },
    });

    if (endedMissions.length > 0) {
      console.log(`Found ${endedMissions.length} missions to finalize`);
      for (const mission of endedMissions) {
        await finalizeMission(mission.id);
      }
    } else {
      console.log('No missions to finalize today');
    }
  });
};
