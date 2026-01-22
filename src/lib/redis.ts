import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      lazyConnect: true,
    })

    redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    redis.on('connect', () => {
      console.log('Redis connected successfully')
    })
  }

  return redis
}

// Helper functions for common operations
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis()
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error('Redis GET error:', error)
    return null
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
  try {
    const redis = getRedis()
    const serialized = JSON.stringify(value)

    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized)
    } else {
      await redis.set(key, serialized)
    }

    return true
  } catch (error) {
    console.error('Redis SET error:', error)
    return false
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  try {
    const redis = getRedis()
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Redis DEL error:', error)
    return false
  }
}

// Shipping cost cache helpers
export function getShippingCacheKey(
  originId: string,
  destinationId: string,
  weight: number,
  courier: string,
): string {
  return `shipping:${originId}:${destinationId}:${weight}:${courier}`
}

export async function getCachedShippingCost(
  originId: string,
  destinationId: string,
  weight: number,
  courier: string,
): Promise<any | null> {
  const key = getShippingCacheKey(originId, destinationId, weight, courier)
  return cacheGet(key)
}

export async function setCachedShippingCost(
  originId: string,
  destinationId: string,
  weight: number,
  courier: string,
  data: any,
  ttlSeconds: number = 86400, // 24 hours default
): Promise<boolean> {
  const key = getShippingCacheKey(originId, destinationId, weight, courier)
  return cacheSet(key, data, ttlSeconds)
}

export default getRedis
