import { createClient } from 'redis';
import config from '../config/index';

export const redisClient = createClient({ url: config.redis_url || 'redis://localhost:6379' });

let isRedisReady = false;

redisClient.on('error', (error) => {
  if (isRedisReady) {
    console.error('Redis error:', error);
  }
});

// In-memory cache fallback for development when Redis is not running
interface CacheEntry {
  value: string;
  expiresAt: number;
}
const memoryStore = new Map<string, CacheEntry>();

export const ensureRedisConnected = async (): Promise<void> => {
  if (!redisClient.isOpen && !isRedisReady) {
    try {
      await redisClient.connect();
      isRedisReady = true;
      console.log('Connected to Redis');
    } catch {
      console.warn('[Cache] Redis unavailable. Using in-memory cache fallback for development.');
    }
  }
};

export const setCache = async <T>(
  key: string,
  value: T,
  expirationInSeconds: number,
): Promise<void> => {
  await ensureRedisConnected();
  if (isRedisReady && redisClient.isOpen) {
    await redisClient.set(key, JSON.stringify(value), { EX: expirationInSeconds });
  } else {
    memoryStore.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + expirationInSeconds * 1000,
    });
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  await ensureRedisConnected();
  if (isRedisReady && redisClient.isOpen) {
    const value = await redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
};

export const getCacheTtl = async (key: string): Promise<number> => {
  await ensureRedisConnected();
  if (isRedisReady && redisClient.isOpen) {
    return redisClient.ttl(key);
  }

  const entry = memoryStore.get(key);
  if (!entry) return -2;
  const remaining = Math.round((entry.expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : -2;
};

export const deleteCache = async (key: string): Promise<void> => {
  await ensureRedisConnected();
  if (isRedisReady && redisClient.isOpen) {
    await redisClient.del(key);
  } else {
    memoryStore.delete(key);
  }
};
