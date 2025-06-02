import { createClient, RedisClientType } from 'redis';

export const redisStore = async (options: { host: string; port: number; auth_pass: string }) => {
    const redisClient: RedisClientType = createClient({
        socket: {
            host: options.host,
            port: options.port,
        },
        password: options.auth_pass,
    });

    await redisClient.connect();

    return {
        async set<T>(key: string, value: T, ttl: number): Promise<void> {
            const serializedValue = JSON.stringify(value);
            if (ttl > 0) {
                await redisClient.setEx(key, ttl, serializedValue);
            } else {
                await redisClient.set(key, serializedValue);
            }
        },

        async get<T>(key: string): Promise<T | undefined> {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : undefined;
        },

        async del(key: string): Promise<void> {
            await redisClient.del(key);
        },

        async reset(): Promise<void> {
            await redisClient.flushAll();
        },

        async keys(pattern: string = '*'): Promise<string[]> {
            return redisClient.keys(pattern);
        },

        async ttl(key: string): Promise<number> {
            return redisClient.ttl(key);
        },

        async quit(): Promise<void> {
            await redisClient.quit();
        },
    };
};
