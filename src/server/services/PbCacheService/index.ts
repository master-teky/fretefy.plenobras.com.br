import {redisClient} from "@/lib/PbRedisClient";
import {createLogger} from "@/lib/PbLoggerLib";

const log = createLogger("PbCacheService");

export class PbCacheService {
    private client = redisClient;

    async get(key: string): Promise<Buffer | null> {
        return this.client.getBuffer(key)
    }

    async set(key: string, buffer: Buffer, ttl: number): Promise<void> {
        await this.client.set(key, buffer, 'EX', ttl)
    }

    async del(...keys: string[]): Promise<void> {
        if (keys.length > 0) await this.client.del(...keys)
    }

    async getJson<T>(key: string): Promise<T | null> {
        const buf = await this.get(key)
        if (!buf) return null
        return JSON.parse(buf.toString('utf-8')) as T
    }

    async setJson(key: string, value: any, ttl: number): Promise<void> {
        await this.set(key, Buffer.from(JSON.stringify(value)), ttl)
    }

    async withCache<T>(key: string, ttl: number, fn: () => Promise<T> | T): Promise<T> {
        try {
            const cached = await this.getJson<T>(key)
            if (cached !== null) return cached
        } catch (err) {
            log.error({err}, `Cache GET error`);
        }
        const result = await fn();
        if (result !== null && result !== undefined) {
            this.setJson(key, result, ttl).catch((e: Error) =>
                log.error({err: e}, `Cache SET error [${key}]: ${e.message}`)
            )
        }
        return result
    }
}

export default new PbCacheService();