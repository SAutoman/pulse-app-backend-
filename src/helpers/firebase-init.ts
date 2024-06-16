import { User } from '@prisma/client';
import admin from 'firebase-admin';

const serviceAccount =
  process.env.NODE_ENV === 'DEBUG'
    ? require('../../t-mate-app-firebase-adminsdk-871wa-e06258fec9.json')
    : require('/etc/secrets/t-mate-app-firebase-adminsdk-871wa-e06258fec9.json'); //FOR RENDER SERVER
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendPushNotification = (
  user: User,
  importance: number,
  type: string,
  message: string,
  title: string
) => {
  //Only send push notification of the user has allowed it
  if (user.push_notifications_allowed === true) {
    try {
      console.log(admin.app.name);
      const notifMessage = {
        notification: {
          title,
          body: message,
        },
        token: user.fcm_token!,
        data: {
          importance: importance.toString(),
          type,
        },
      };

      admin
        .messaging()
        .send(notifMessage)
        .then((response) => {
          console.log('Successfully sent message:', response);
        })
        .catch((error) => {
          console.log('Error sending message:', error);
        });
    } catch (error) {
      console.log('Error: ', error);
    }
  }
};

export { sendPushNotification };
