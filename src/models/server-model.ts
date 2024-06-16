import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from '../middlewares/error-handler';

import authRouter from '../routers/auth-router';
import stravaRouter from '../routers/strava-router';
import garminRouter from '../routers/garmin-router';
import stravaWebhookRouter from '../routers/strava-webhook';
import usersRouter from '../routers/users-router';
import activitiesRouter from '../routers/activities-router';
import { cronEndOfWeek } from '../helpers/cron-jobs/weekly-ranking-update';
import notificationsRouter from '../routers/notifications-router';
import rewardsRouter from '../routers/rewards-router';
import missionsRouter from '../routers/missions-router';
import missionAttemptsRouter from '../routers/mission-attempts-router';
import clubsRouter from '../routers/clubs-router';
import userClubsRouter from '../routers/user-clubs-router';
import missionClubsRouter from '../routers/mission-clubs-router';
import sportTypesRouter from '../routers/sport-types-router';
import { cronDailyMissionClose } from '../helpers/cron-jobs/daily-close-missions';
import rankingCategoriesRouter from '../routers/ranking-categories-router';
import rankingLeaguesRouter from '../routers/ranking-leagues-router';
import badgesRouter from '../routers/badges-router';
import userBadgesRouter from '../routers/user-badges-router';
import coinTransactionsRouter from '../routers/coin-transactions-router';
import appSettingsRouter from '../routers/app-settings-router';
import deviceHealthRouter from '../routers/device-health-router';

class Server {
  app: Express;
  port: String | undefined;
  authPath: string;
  stravaPath: string;
  garminPath: string;
  stravaWebhookPath: string;
  usersPath: string;
  activitiesPath: string;
  notificationsPath: string;
  rewardsPath: string;
  missionsPath: string;
  missionAttemptsPath: string;
  clubsPath: string;
  userClubsPath: string;
  missionClubsPath: string;
  sportTypesPath: string;
  rankingLeaguesPath: string;
  rankingCategoriesPath: string;
  badgesPath: string;
  userBadgesPath: string;
  coinsTransactionsPath: string;
  appSettingsPath: string;
  deviceHealthPath: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.authPath = '/auth';
    this.stravaPath = '/strava';
    this.garminPath = '/garmin';
    this.stravaWebhookPath = '/webhook';
    this.usersPath = '/users';
    this.activitiesPath = '/activities';
    this.notificationsPath = '/notifications';
    this.rewardsPath = '/rewards';
    this.missionsPath = '/missions';
    this.missionAttemptsPath = '/mission-attempts';
    this.clubsPath = '/clubs';
    this.userClubsPath = '/user-clubs';
    this.missionClubsPath = '/mission-clubs';
    this.sportTypesPath = '/sport-types';
    this.rankingCategoriesPath = '/ranking-categories';
    this.rankingLeaguesPath = '/ranking-leagues';
    this.badgesPath = '/badges';
    this.userBadgesPath = '/user-badges';
    this.coinsTransactionsPath = '/coin-transactions';
    this.appSettingsPath = '/app-settings';
    this.deviceHealthPath = '/device-health';

    //Middlewares
    this.middlewares();
    //Routers
    this.routes();

    //Default error handler
    this.app.use(errorHandler);

    //Cron Jobs
    this.setupCronJobs();

    //Init firebase admin

    //Listen
    this.listen();
  }

  //Listen
  listen() {
    this.app.listen(this.port, () =>
      console.log(`Server listening on PORT: ${this.port}`)
    );
  }

  //Middlewares
  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(morgan('dev'));
  }

  //Routers
  routes() {
    this.app.use(this.authPath, authRouter);
    this.app.use(this.stravaPath, stravaRouter);
    this.app.use(this.garminPath,garminRouter);
    this.app.use(this.stravaWebhookPath, stravaWebhookRouter);
    this.app.use(this.usersPath, usersRouter);
    this.app.use(this.activitiesPath, activitiesRouter);
    this.app.use(this.notificationsPath, notificationsRouter);
    this.app.use(this.rewardsPath, rewardsRouter);
    this.app.use(this.missionsPath, missionsRouter);
    this.app.use(this.missionAttemptsPath, missionAttemptsRouter);
    this.app.use(this.clubsPath, clubsRouter);
    this.app.use(this.userClubsPath, userClubsRouter);
    this.app.use(this.missionClubsPath, missionClubsRouter);
    this.app.use(this.sportTypesPath, sportTypesRouter);
    this.app.use(this.rankingCategoriesPath, rankingCategoriesRouter);
    this.app.use(this.rankingLeaguesPath, rankingLeaguesRouter);
    this.app.use(this.badgesPath, badgesRouter);
    this.app.use(this.userBadgesPath, userBadgesRouter);
    this.app.use(this.coinsTransactionsPath, coinTransactionsRouter);
    this.app.use(this.appSettingsPath, appSettingsRouter);
    this.app.use(this.deviceHealthPath, deviceHealthRouter);
  }

  //Cron Jobs
  setupCronJobs() {
    cronEndOfWeek();
    cronDailyMissionClose();
  }

  //Firebase ADMIN
  firebaseInit() {}
}

//Exports
export default Server;
