// This file belongs to the config package (settings)
package com.enterprise.analytics.config;

// Lets us use the @Cacheable annotation
import org.springframework.cache.annotation.EnableCaching;
// Lets us make Spring-managed objects with @Bean
import org.springframework.context.annotation.Bean;
// Says this class holds settings
import org.springframework.context.annotation.Configuration;
// The settings for a Redis cache
import org.springframework.data.redis.cache.RedisCacheConfiguration;
// The object that manages our caches in Redis
import org.springframework.data.redis.cache.RedisCacheManager;
// The connection to Redis
import org.springframework.data.redis.connection.RedisConnectionFactory;
// Turns Java objects into JSON for Redis (and back)
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
// Lets us choose how values are saved in Redis
import org.springframework.data.redis.serializer.RedisSerializationContext;

// A type for lengths of time
import java.time.Duration;

/**
 * Configures Spring Cache backed by Redis.
 *
 * @EnableCaching activates the @Cacheable / @CacheEvict annotations.
 * Without this, those annotations are silently ignored.
 *
 * Cache TTL = 5 minutes — team analytics don't need to be real-time;
 * caching saves repeated GROUP BY aggregation queries on large tables.
 *
 * GenericJackson2JsonRedisSerializer embeds the Java class name in the
 * Redis value so Spring can deserialize back to the correct type.
 */
// Says this class holds settings
@Configuration
// Turns on caching (without this, @Cacheable does nothing)
@EnableCaching
// This class sets up the Redis cache
public class RedisConfig {

    // Spring keeps this object and uses it for all caching
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Start with the default cache settings, then change a few
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                // Each cached value is deleted after 5 minutes
                .entryTtl(Duration.ofMinutes(5))
                // Don't cache empty (null) results
                .disableCachingNullValues()
                // Choose how values are saved in Redis
                .serializeValuesWith(
                        // Use a pair that turns objects into JSON and back
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                // This one saves the class name too, so we get the right type back
                                new GenericJackson2JsonRedisSerializer()
                        )
                );

        // Build the cache manager using our connection and settings
        return RedisCacheManager.builder(connectionFactory)
                // Use our settings for every cache
                .cacheDefaults(config)
                // Finish and return it
                .build();
    }
}
