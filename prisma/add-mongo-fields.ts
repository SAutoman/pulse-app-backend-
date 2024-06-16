import prisma from '../src/helpers/prisma-client';

const addMongoDBFields = async () => {
  const result = await prisma.club.updateMany({
    data: {
      // is_active: true,
      // category: 'NOVICE',
      // league: 10,
      // coins: 0,
      // image_url:
      //   'https://dgalywyr863hv.cloudfront.net/pictures/athletes/22947703/25344532/1/large.jpg',
      sport_type_id: '6625bdbfba5a2e6c4f223745',
    },
  });

  console.log('Update Ran in MongoDB');
  console.log(result);
};

const addMongoDBFieldsEpochMS = async () => {
  // Fetch all activities that need updating
  const activities = await prisma.activity.findMany({
    select: {
      id: true,
      created_at: true,
      start_date: true,
      elapsed_time: true, // Assuming this is in seconds
    },
    //where: { userId: '65a7d9b81d7d5851d36a1171' },
  });

  const totalActivities = activities.length;
  console.log(`Total activities to update: ${totalActivities}`);

  for (let index = 0; index < totalActivities; index++) {
    const activity = activities[index];
    // Convert created_at and start_date to milliseconds since the epoch
    const created_at_epoch_ms = new Date(activity.created_at).getTime();
    const start_date_epoch_ms = new Date(activity.start_date).getTime();
    // Assuming elapsed_time is in seconds, convert to milliseconds and add to start_date_epoch_ms
    const end_date_epoch_ms =
      start_date_epoch_ms + activity.elapsed_time * 1000;

    // Update the activity with the new fields
    await prisma.activity.update({
      where: { id: activity.id },
      data: {
        created_at_epoch_ms: created_at_epoch_ms.toString(),
        start_date_epoch_ms: start_date_epoch_ms.toString(),
        end_date_epoch_ms: end_date_epoch_ms.toString(),
      },
    });

    // Log the progress
    console.log(`Updated activity ${index + 1} of ${totalActivities}`);
  }

  console.log('All activities have been updated.');
};
const changeStravaIdToString = async () => {
  // Fetch all activities that need updating
  const activities = await prisma.activity.findMany({
    select: {
      id: true,
      strava_id: true,
    },
    where: { id: '659407006183c58aa6ab3b81' },
  });
  const totalActivities = activities.length;
  console.log(`Total activities to update: ${totalActivities}`);

  for (let index = 0; index < totalActivities; index++) {
    const activity = activities[index];
    const strava_id_string = activity.strava_id.toString();

    // Update the activity with the new fields
    await prisma.activity.update({
      where: { id: activity.id },
      data: {
        strava_id: strava_id_string,
      },
    });

    // Log the progress
    console.log(`Updated activity ${index + 1} of ${totalActivities}`);
  }

  console.log('All activities have been updated.');
};

addMongoDBFields();

// addMongoDBFieldsEpochMS().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });

// changeStravaIdToString().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });

//Should run: npx ts-node prisma/add-mongo-fields.ts
