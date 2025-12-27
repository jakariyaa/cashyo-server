// src/modules/system/system.routes.ts
import { Router } from 'express';
import { getSystemStats, getFeaturedAgents } from './system.controller';

const router = Router();

// Public endpoints
router.get('/stats', getSystemStats);
router.get('/agents', getFeaturedAgents);

export default router;
