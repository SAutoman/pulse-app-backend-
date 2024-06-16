import dotenv from 'dotenv';
import Server from './models/server-model';

dotenv.config();
const DEBUG_MODE = process.env.NODE_ENV === 'DEBUG';

const server = new Server();


export { DEBUG_MODE };
