import {env} from '@/lib/PbEnvLib'
import Redis from "ioredis";
import {createLogger} from "@/lib/PbLoggerLib";

const HOST = env.REDIS_HOST;
const PORT = env.REDIS_PORT;

const log = createLogger("RedisClient");

export const redisClient = new Redis({host: HOST, port: PORT});

redisClient.on("error", (err) => {
    log.error({err}, `Redis error: ${err.message}`);
})

export async function closeRedis() {
    try {
        await redisClient.quit()
    } catch {
        redisClient.disconnect();
    }
}