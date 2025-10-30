export const MATCHING_INTERVAL_MS = Number(process.env.MATCHING_INTERVAL_MS || 1000);
export const MATCH_TIMEOUT_MS = Number(process.env.MATCH_TIMEOUT || 30000);
export const MATCHING_LOCK_KEY = 'lock:matching_worker';
export const MATCHING_LOCK_TTL = 2000;
export const ALL_TOPICS = 'all';
export const ALL_DIFFICULTIES = 'all';