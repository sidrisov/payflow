package ua.sinaver.web3.payflow.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import ua.sinaver.web3.payflow.message.farcaster.StorageAllocationsResponse;
import ua.sinaver.web3.payflow.message.farcaster.StorageUsage;

import java.time.Duration;
import java.util.HashMap;

@Configuration
public class CacheConfig {
	public static final String CACHE_PREFIX_VERSION = "v0.0.11_0:";
	public static final String CONTACTS_CACHE_NAME = CACHE_PREFIX_VERSION + "contacts-1";
	public static final String CONTACT_LIST_CACHE_NAME = CACHE_PREFIX_VERSION + "contact-list";
	public static final String FAN_TOKEN_CACHE_NAME = CACHE_PREFIX_VERSION + "moxie-fan-token";
	public static final String SOCIALS_CACHE_NAME = CACHE_PREFIX_VERSION + "socials";
	public static final String SOCIALS_INSIGHTS_CACHE_NAME = CACHE_PREFIX_VERSION + "insights";
	public static final String FARCASTER_VERIFICATIONS_CACHE_NAME = CACHE_PREFIX_VERSION + "1" +
			"verifications";
	public static final String NEYNAR_FARCASTER_USER_CACHE = CACHE_PREFIX_VERSION + "farcaster-users";
	public static final String NEYNAR_STORAGE_USAGE_CACHE = CACHE_PREFIX_VERSION + "farcaster-storage-usage";
	public static final String NEYNAR_STORAGE_ALLOCATION_CACHE = CACHE_PREFIX_VERSION + "farcaster-storage-allocation";
	public static final String RODEO_WALLETS_CACHE = CACHE_PREFIX_VERSION + "rodeo-wallets";

	public static final String USERS_CACHE_NAME = CACHE_PREFIX_VERSION + "users";
	public static final String INVITATIONS_CACHE_NAME = CACHE_PREFIX_VERSION + "invitations";
	public static final String DAILY_STATS_CACHE = CACHE_PREFIX_VERSION + "stats";
	public static final String BANKR_WALLETS_CACHE = CACHE_PREFIX_VERSION + "bankr-wallets";
	public static final String USER_FLOWS_CACHE = CACHE_PREFIX_VERSION + "user-flows";
	public static final String AGENT_ATTEMPTS_CACHE = CACHE_PREFIX_VERSION + "agent-attempts";

	@Value("${spring.cache.contacts.all.expireAfterWrite:10m}")
	private Duration contactsExpireAfterWriteDuration;
	@Value("${spring.cache.contacts.list.expireAfterWrite:10m}")
	private Duration contactsListExpireAfterWriteDuration;
	@Value("${spring.cache.socials.expireAfterWrite:24h}")
	private Duration socialsExpireAfterWriteDuration;
	@Value("${spring.cache.verifications.expireAfterWrite:24h}")
	private Duration verificationsExpireAfterWriteDuration;
	@Value("${spring.cache.socials.maxSize:1000}")
	private int socialsMaxSize;
	@Value("${spring.cache.storage.expireAfterWrite:4h}")
	private Duration storageExpireAfterWriteDuration;
	@Value("${spring.cache.stats.expireAfterWrite:24h}")
	private Duration statsExpireAfterWriteDuration;
	@Value("${spring.cache.bankr.expireAfterWrite:30d}")
	private Duration bankrExpireAfterWriteDuration;
	@Value("${spring.cache.flows.expireAfterWrite:1h}")
	private Duration flowsExpireAfterWriteDuration;
	@Value("${spring.cache.rodeo.expireAfterWrite:30d}")
	private Duration rodeoExpireAfterWriteDuration;
	@Value("${spring.cache.agent-attempts.expireAfterWrite:24h}")
	private Duration agentAttemptsExpireAfterWriteDuration;

	@Autowired
	private ObjectMapper objectMapper;

	// redis cache
	@Bean
	RedisCacheConfiguration cacheConfiguration() {
		return RedisCacheConfiguration
				.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(Duration.ofMinutes(30))
				.enableTimeToIdle()
				.serializeValuesWith(RedisSerializationContext.SerializationPair
						.fromSerializer(new GenericJackson2JsonRedisSerializer()));
	}

	@Bean
	@Profile("redis")
	CacheManager redisCacheManager(RedisConnectionFactory connectionFactory,
			RedisCacheConfiguration configuration) {
		val cacheConfigurations = new HashMap<String, RedisCacheConfiguration>();

		// Basic configs with different TTLs
		cacheConfigurations.put(CONTACTS_CACHE_NAME, configuration.entryTtl(contactsExpireAfterWriteDuration));
		cacheConfigurations.put(CONTACT_LIST_CACHE_NAME, configuration.entryTtl(contactsListExpireAfterWriteDuration));
		cacheConfigurations.put(FAN_TOKEN_CACHE_NAME, configuration.entryTtl(Duration.ofMinutes(5)));
		cacheConfigurations.put(SOCIALS_CACHE_NAME, configuration.entryTtl(socialsExpireAfterWriteDuration));
		cacheConfigurations.put(SOCIALS_INSIGHTS_CACHE_NAME, configuration.entryTtl(socialsExpireAfterWriteDuration));
		cacheConfigurations.put(NEYNAR_FARCASTER_USER_CACHE,
				configuration.entryTtl(verificationsExpireAfterWriteDuration));
		cacheConfigurations.put(FARCASTER_VERIFICATIONS_CACHE_NAME,
				configuration.entryTtl(verificationsExpireAfterWriteDuration));
		cacheConfigurations.put(USERS_CACHE_NAME, configuration);
		cacheConfigurations.put(INVITATIONS_CACHE_NAME, configuration);

		// Special configs with custom serializers
		cacheConfigurations.put(NEYNAR_STORAGE_USAGE_CACHE,
				configuration.entryTtl(storageExpireAfterWriteDuration)
						.serializeValuesWith(RedisSerializationContext.SerializationPair
								.fromSerializer(new Jackson2JsonRedisSerializer<>(objectMapper, StorageUsage.class))));
		cacheConfigurations.put(NEYNAR_STORAGE_ALLOCATION_CACHE,
				configuration.entryTtl(storageExpireAfterWriteDuration)
						.serializeValuesWith(RedisSerializationContext.SerializationPair
								.fromSerializer(new Jackson2JsonRedisSerializer<>(objectMapper,
										StorageAllocationsResponse.class))));

		// Add daily stats cache configuration
		cacheConfigurations.put(DAILY_STATS_CACHE, configuration.entryTtl(statsExpireAfterWriteDuration));

		// Add Bankr wallets cache configuration
		cacheConfigurations.put(BANKR_WALLETS_CACHE, configuration.entryTtl(bankrExpireAfterWriteDuration));

		// Add user flows cache configuration
		cacheConfigurations.put(USER_FLOWS_CACHE, configuration.entryTtl(flowsExpireAfterWriteDuration));

		// Add Rodeo wallets cache configuration
		cacheConfigurations.put(RODEO_WALLETS_CACHE, configuration.entryTtl(rodeoExpireAfterWriteDuration));

		// Add agent attempts cache configuration
		cacheConfigurations.put(AGENT_ATTEMPTS_CACHE, configuration.entryTtl(agentAttemptsExpireAfterWriteDuration));

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
		// Define cache specifications
		val cacheSpecs = new HashMap<String, Cache<Object, Object>>();
		cacheSpecs.put(CONTACTS_CACHE_NAME, buildCache(contactsExpireAfterWriteDuration));
		cacheSpecs.put(CONTACT_LIST_CACHE_NAME, buildCache(contactsListExpireAfterWriteDuration));
		cacheSpecs.put(FAN_TOKEN_CACHE_NAME, buildCache(Duration.ofMinutes(5)));
		cacheSpecs.put(SOCIALS_CACHE_NAME, buildCache(socialsExpireAfterWriteDuration, socialsMaxSize));
		cacheSpecs.put(SOCIALS_INSIGHTS_CACHE_NAME, buildCache(socialsExpireAfterWriteDuration, socialsMaxSize));
		cacheSpecs.put(FARCASTER_VERIFICATIONS_CACHE_NAME,
				buildCache(verificationsExpireAfterWriteDuration, socialsMaxSize));
		cacheSpecs.put(NEYNAR_FARCASTER_USER_CACHE, buildCache(verificationsExpireAfterWriteDuration, socialsMaxSize));
		cacheSpecs.put(USERS_CACHE_NAME, buildCache(Duration.ofHours(24)));
		cacheSpecs.put(INVITATIONS_CACHE_NAME, buildCache(Duration.ofHours(24)));
		cacheSpecs.put(NEYNAR_STORAGE_USAGE_CACHE, buildCache(storageExpireAfterWriteDuration));
		cacheSpecs.put(NEYNAR_STORAGE_ALLOCATION_CACHE, buildCache(storageExpireAfterWriteDuration));
		cacheSpecs.put(DAILY_STATS_CACHE, buildCache(statsExpireAfterWriteDuration));
		cacheSpecs.put(BANKR_WALLETS_CACHE, buildCache(bankrExpireAfterWriteDuration));
		cacheSpecs.put(USER_FLOWS_CACHE, buildCache(flowsExpireAfterWriteDuration));
		cacheSpecs.put(RODEO_WALLETS_CACHE, buildCache(rodeoExpireAfterWriteDuration));
		cacheSpecs.put(AGENT_ATTEMPTS_CACHE, buildCache(agentAttemptsExpireAfterWriteDuration));

		// Register all caches
		cacheSpecs.forEach(cacheManager::registerCustomCache);

		return cacheManager;
	}

	private Cache<Object, Object> buildCache(Duration expireAfterWrite, int maximumSize) {
		return Caffeine.newBuilder()
				.expireAfterWrite(expireAfterWrite)
				.maximumSize(maximumSize)
				.build();
	}

	private Cache<Object, Object> buildCache(Duration expireAfterWrite) {
		return buildCache(expireAfterWrite, 200);
	}
}
