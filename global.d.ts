namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    DATABASE_URL: string;
    SECRET_JWT_KEY: string;
    STRAVA_CLIENT_ID: string;
    STRAVA_CLIENT_SECRET: string;
    NODE_ENV: string;
    NM_EMAIL: string;
    NM_PASSW: string;
  }
}
