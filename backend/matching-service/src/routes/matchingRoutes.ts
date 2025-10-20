import express, { RequestHandler } from 'express';
import { startMatching, cancelMatch } from '../controllers/matchingController';

const router: express.Router = express.Router();
router.post('/', startMatching as RequestHandler);
router.delete('/:socketId', cancelMatch as RequestHandler);
export default router;