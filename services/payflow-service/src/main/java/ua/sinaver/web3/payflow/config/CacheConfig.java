package ua.sinaver.web3.payflow.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.val;
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

@Configuration
public class CacheConfig {

	public static final String CONTACTS_CACHE_NAME = "contacts";
	public static final String SOCIALS_CACHE_NAME = "socials";
	public static final String ETH_DENVER_PARTICIPANTS_CACHE_NAME = "eth-denver-contacts";
	public static final String USERS_CACHE_NAME = "users";
	public static final String INVITATIONS_CACHE_NAME = "invitations";

	@Value("${spring.cache.contacts.expireAfterWrite:10m}")
	private Duration contactsExpireAfterWriteDuration;

	@Value("${spring.cache.eth-denver.contacts.expireAfterWrite:10m}")
	private Duration ethDenverContactsExpireAfterWriteDuration;
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

		val contactsCacheConfigs = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(contactsExpireAfterWriteDuration)
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(new GenericJackson2JsonRedisSerializer()));

		val ethDenverContactsCacheConfigs =
				RedisCacheConfiguration.defaultCacheConfig()
						.disableCachingNullValues()
						.entryTtl(ethDenverContactsExpireAfterWriteDuration)
						.serializeValuesWith(RedisSerializationContext
								.SerializationPair
								.fromSerializer(new GenericJackson2JsonRedisSerializer()));
		;

		val socialsCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(socialsExpireAfterWriteDuration)
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(new GenericJackson2JsonRedisSerializer()));

		val cacheConfigurations = new HashMap<String, RedisCacheConfiguration>();
		cacheConfigurations.put(CONTACTS_CACHE_NAME, contactsCacheConfigs);
		cacheConfigurations.put(ETH_DENVER_PARTICIPANTS_CACHE_NAME, ethDenverContactsCacheConfigs);
		cacheConfigurations.put(SOCIALS_CACHE_NAME, socialsCacheConfig);
		cacheConfigurations.put(USERS_CACHE_NAME, configuration);
		cacheConfigurations.put(INVITATIONS_CACHE_NAME, configuration);

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
		val cacheManager = new CaffeineCacheManager();

		cacheManager.registerCustomCache(CONTACTS_CACHE_NAME,
				buildCache(contactsExpireAfterWriteDuration));

		cacheManager.registerCustomCache(ETH_DENVER_PARTICIPANTS_CACHE_NAME,
				buildCache(ethDenverContactsExpireAfterWriteDuration));

		cacheManager.registerCustomCache(SOCIALS_CACHE_NAME,
				buildCache(socialsExpireAfterWriteDuration, socialsMaxSize));

		cacheManager.registerCustomCache(USERS_CACHE_NAME,
				buildCache(Duration.ofHours(24)));

		cacheManager.registerCustomCache(INVITATIONS_CACHE_NAME,
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
