import { redis } from '../config/redis';

function token() {
  return Math.random().toString(36).slice(2);
}

export async function acquireLock(key: string, ttlMs: number): Promise<{ ok: boolean; token?: string }> {
  const t = token();
  const ok = await redis.set(key, t, { NX: true, PX: ttlMs });
  return { ok: !!ok, token: ok ? t : undefined };
}

export async function releaseLock(key: string, token: string): Promise<void> {
  const lua = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(lua, { keys: [key], arguments: [token] });
}
