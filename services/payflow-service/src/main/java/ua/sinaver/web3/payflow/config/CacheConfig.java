package ua.sinaver.web3.payflow.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class CacheConfig {

	// TODO: either bind CaffeineSpec per cache or find out if nesting works automatically
	@Value("${spring.cache.contacts.expireAfterWrite:10m}")
	private Duration contactsExpireAfterWriteDuration;

	@Value("${spring.cache.socials.expireAfterWrite:24h}")
	private Duration socialsExpireAfterWriteDuration;

	@Value("${spring.cache.socials.maxSize:1000}")
	private int socialsMaxSize;

	// redis cache
	@Bean
	RedisCacheConfiguration cacheConfiguration() {
		return RedisCacheConfiguration
				.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(Duration.ofMinutes(30))
				.enableTimeToIdle()
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(new GenericJackson2JsonRedisSerializer()));
	}

	@Bean
	@Profile("redis")
	CacheManager redisCacheManager(RedisConnectionFactory connectionFactory,
	                               RedisCacheConfiguration configuration) {

		RedisCacheConfiguration contactsCacheConfigs = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(contactsExpireAfterWriteDuration)
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(new GenericJackson2JsonRedisSerializer()));
		;

		RedisCacheConfiguration socialsCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(socialsExpireAfterWriteDuration)
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(new GenericJackson2JsonRedisSerializer()));

		Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
		cacheConfigurations.put("contacts", contactsCacheConfigs);
		cacheConfigurations.put("socials", socialsCacheConfig);
		cacheConfigurations.put("users", configuration);
		cacheConfigurations.put("invitations", configuration);

		return RedisCacheManager
				.builder(connectionFactory)
				.cacheDefaults(configuration)
				.withInitialCacheConfigurations(cacheConfigurations)
				.build();
	}

	// caffeine cache
	@Bean
	@Profile("caffeine")
	CacheManager caffeineCacheManager() {
		CaffeineCacheManager cacheManager = new CaffeineCacheManager();

		cacheManager.registerCustomCache("contacts",
				buildCache(contactsExpireAfterWriteDuration));

		cacheManager.registerCustomCache("socials",
				buildCache(socialsExpireAfterWriteDuration, socialsMaxSize));

		cacheManager.registerCustomCache("users",
				buildCache(Duration.ofHours(24)));

		cacheManager.registerCustomCache("invitations",
				buildCache(Duration.ofHours(24)));


		return cacheManager;
	}

	private Cache buildCache(Duration expireAfterWrite, int maximumSize) {
		return Caffeine.newBuilder()
				.expireAfterWrite(expireAfterWrite)
				.maximumSize(maximumSize)
				.build();
	}

	private Cache buildCache(Duration expireAfterWrite) {
		return buildCache(expireAfterWrite, 200);
	}
}
