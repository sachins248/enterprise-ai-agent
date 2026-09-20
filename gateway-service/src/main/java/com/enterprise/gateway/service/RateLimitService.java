package com.enterprise.gateway.service;

import org.springframework.data.domain.Range;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Implements a sliding window rate limiter using Redis sorted sets.
 *
 * How it works:
 *   - Each user gets a Redis sorted set: key = "rate_limit:{userId}"
 *   - Each request adds one entry: score = timestamp (ms), value = unique ID
 *   - A Lua script atomically: removes old entries, counts current, rejects or allows
 *
 * Why Lua? Redis executes Lua scripts atomically — no race conditions between
 * the check (count) and the write (add entry). Without Lua, two simultaneous
 * requests could both pass the check and both get added, exceeding the limit.
 */
@Service
public class RateLimitService {

    private static final long WINDOW_MS = 3_600_000L;  // 1 hour in milliseconds

    // Lua script: atomic sliding window check-and-increment
    private static final String SLIDING_WINDOW_LUA = """
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local window = tonumber(ARGV[2])
            local limit = tonumber(ARGV[3])
            local unique = ARGV[4]

            -- Remove all entries older than the window
            redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

            -- Count how many requests are in the current window
            local count = redis.call('ZCARD', key)

            if count >= limit then
                return 0
            end

            -- Add this request (score = timestamp, value = unique ID to avoid collision)
            redis.call('ZADD', key, now, unique)

            -- Auto-expire the key after the window (cleanup)
            redis.call('EXPIRE', key, math.ceil(window / 1000))

            return 1
            """;

    private final ReactiveStringRedisTemplate redisTemplate;
    private final RedisScript<Long> slidingWindowScript;

    public RateLimitService(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.slidingWindowScript = RedisScript.of(SLIDING_WINDOW_LUA, Long.class);
    }

    /**
     * Returns true if the request is allowed, false if rate limited.
     */
    public Mono<Boolean> isAllowed(String userId, int limitPerHour) {
        String key = "rate_limit:" + userId;
        long now = System.currentTimeMillis();
        String unique = userId + "-" + now + "-" + Math.random();

        return redisTemplate.execute(
                slidingWindowScript,
                List.of(key),
                List.of(String.valueOf(now), String.valueOf(WINDOW_MS),
                        String.valueOf(limitPerHour), unique)
        ).next().map(result -> result == 1L).defaultIfEmpty(true);
    }

    /**
     * Returns how many requests the user has made in the current window.
     * Used to populate the Retry-After header.
     */
    public Mono<Long> getCurrentCount(String userId) {
        String key = "rate_limit:" + userId;
        long now = System.currentTimeMillis();
        return redisTemplate.opsForZSet()
                .count(key, Range.closed((double) (now - WINDOW_MS), (double) now))
                .defaultIfEmpty(0L);
    }
}
