import { Router } from 'express';
import { getWebhook, receivedEvent } from '../controllers/strava-webhook';

const router = Router();

router.post('/', receivedEvent);

router.get('/',getWebhook)

//Exports
export default router;
