// This file belongs to the service package (business logic)
package com.enterprise.gateway.service;

// Used to describe a range of numbers
import org.springframework.data.domain.Range;
// The tool we use to talk to Redis without blocking
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
// The type for a Lua script we send to Redis
import org.springframework.data.redis.core.script.RedisScript;
// Marks this class as a service
import org.springframework.stereotype.Service;
// Mono means "a result that arrives later" (used in reactive code)
import reactor.core.publisher.Mono;

// Used for lists of keys and values
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
// Marks this class as a service so Spring can create it
@Service
// This class counts requests per user and says yes or no
public class RateLimitService {

    // The window is 1 hour, written in milliseconds
    private static final long WINDOW_MS = 3_600_000L;  // 1 hour in milliseconds

    // Lua script: atomic sliding window check-and-increment
    // The script below runs inside Redis (it is Lua code, not Java)
    private static final String SLIDING_WINDOW_LUA = """
            -- The Redis key for this user
            local key = KEYS[1]
            -- The current time in milliseconds
            local now = tonumber(ARGV[1])
            -- The window size in milliseconds
            local window = tonumber(ARGV[2])
            -- The most requests allowed in the window
            local limit = tonumber(ARGV[3])
            -- A unique id for this request
            local unique = ARGV[4]

            -- Remove all entries older than the window
            redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

            -- Count how many requests are in the current window
            local count = redis.call('ZCARD', key)

            -- If the user is already at the limit, say no (0)
            if count >= limit then
                return 0
            end

            -- Add this request (score = timestamp, value = unique ID to avoid collision)
            redis.call('ZADD', key, now, unique)

            -- Auto-expire the key after the window (cleanup)
            redis.call('EXPIRE', key, math.ceil(window / 1000))

            -- Say yes (1)
            return 1
            """;

    // Used to talk to Redis
    private final ReactiveStringRedisTemplate redisTemplate;
    // The Lua script, ready to send to Redis
    private final RedisScript<Long> slidingWindowScript;

    // Spring gives us the Redis tool when it creates this class
    public RateLimitService(ReactiveStringRedisTemplate redisTemplate) {
        // Save the Redis tool
        this.redisTemplate = redisTemplate;
        // Turn the Lua text into a script object that returns a number
        this.slidingWindowScript = RedisScript.of(SLIDING_WINDOW_LUA, Long.class);
    }

    /**
     * Returns true if the request is allowed, false if rate limited.
     */
    // Checks and counts one request for this user
    public Mono<Boolean> isAllowed(String userId, int limitPerHour) {
        // Each user has their own key in Redis
        String key = "rate_limit:" + userId;
        // The current time in milliseconds
        long now = System.currentTimeMillis();
        // Make a unique id so two requests in the same millisecond don't overwrite each other
        String unique = userId + "-" + now + "-" + Math.random();

        // Run the Lua script in Redis
        return redisTemplate.execute(
                // The script to run
                slidingWindowScript,
                // The keys the script uses
                List.of(key),
                // The values the script uses (time, window size, limit, unique id)
                List.of(String.valueOf(now), String.valueOf(WINDOW_MS),
                        String.valueOf(limitPerHour), unique)
        // Take the first result, and turn 1 into true and 0 into false
        // If Redis gives no answer, allow the request (better than blocking everyone)
        ).next().map(result -> result == 1L).defaultIfEmpty(true);
    }

    /**
     * Returns how many requests the user has made in the current window.
     * Used to populate the Retry-After header.
     */
    // Counts how many requests the user made in the last hour
    public Mono<Long> getCurrentCount(String userId) {
        // Each user has their own key in Redis
        String key = "rate_limit:" + userId;
        // The current time in milliseconds
        long now = System.currentTimeMillis();
        // Ask Redis how many entries are inside the window
        return redisTemplate.opsForZSet()
                // Count entries whose time is between one hour ago and now
                .count(key, Range.closed((double) (now - WINDOW_MS), (double) now))
                // If there is no answer, say 0
                .defaultIfEmpty(0L);
    }
}
