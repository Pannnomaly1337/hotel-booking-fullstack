import { ConflictException, Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { randomUUID } from "crypto";
import { REDIS_CLIENT } from "./redis.constants";

const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end`;

@Injectable()
export class LockService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    opts: { ttlMs?: number; retries?: number; retryDelayMs?: number } = {},
  ): Promise<T> {
    const { ttlMs = 5000, retries = 10, retryDelayMs = 100 } = opts;
    const lockKey = `lock:${key}`;
    const token = randomUUID();

    let acquired = false;
    for (let i = 0; i < retries; i++) {
      const res = await this.redis.set(lockKey, token, "PX", ttlMs, "NX");
      if (res === "OK") {
        acquired = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    if (!acquired) {
      throw new ConflictException("Resource is busy, please try again");
    }

    try {
      return await fn();
    } finally {
      await this.redis.eval(RELEASE_SCRIPT, 1, lockKey, token);
    }
  }
}
