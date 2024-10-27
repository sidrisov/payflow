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
	public static final String CACHE_PREFIX_VERSION = "v0.0.11_0:";
	public static final String CONTACTS_CACHE_NAME = CACHE_PREFIX_VERSION + "contacts";
	public static final String CONTACT_LIST_CACHE_NAME = CACHE_PREFIX_VERSION + "contact-list";
	public static final String FAN_TOKENS_CACHE_NAME = CACHE_PREFIX_VERSION + "moxie-fan-tokens";
	public static final String FAN_TOKEN_CACHE_NAME = CACHE_PREFIX_VERSION + "moxie-fan-token";
	public static final String SOCIALS_CACHE_NAME = CACHE_PREFIX_VERSION + "socials";
	public static final String SOCIALS_INSIGHTS_CACHE_NAME = CACHE_PREFIX_VERSION + "insights";
	public static final String FARCASTER_VERIFICATIONS_CACHE_NAME = CACHE_PREFIX_VERSION + "1" +
			"verifications";
	public static final String NEYNAR_FARCASTER_USER_CACHE = CACHE_PREFIX_VERSION + "farcaster-users";
	public static final String USERS_CACHE_NAME = CACHE_PREFIX_VERSION + "users";
	public static final String INVITATIONS_CACHE_NAME = CACHE_PREFIX_VERSION + "invitations";

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
		val serializer = new GenericJackson2JsonRedisSerializer();
		val contactsCacheConfigs = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(contactsExpireAfterWriteDuration)
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(serializer));

		val contactsListCacheConfigs = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(contactsListExpireAfterWriteDuration)
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(serializer));

		val fanTokenCacheConfigs = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(Duration.ofMinutes(5))
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(serializer));

		val socialsCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(socialsExpireAfterWriteDuration)
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(serializer));

		val verificationsCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(verificationsExpireAfterWriteDuration)
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(serializer));

		val cacheConfigurations = new HashMap<String, RedisCacheConfiguration>();
		cacheConfigurations.put(CONTACTS_CACHE_NAME, contactsCacheConfigs);
		cacheConfigurations.put(CONTACT_LIST_CACHE_NAME, contactsListCacheConfigs);
		cacheConfigurations.put(FAN_TOKENS_CACHE_NAME, contactsCacheConfigs);
		cacheConfigurations.put(FAN_TOKEN_CACHE_NAME, fanTokenCacheConfigs);
		cacheConfigurations.put(SOCIALS_CACHE_NAME, socialsCacheConfig);
		cacheConfigurations.put(SOCIALS_INSIGHTS_CACHE_NAME, socialsCacheConfig);
		cacheConfigurations.put(NEYNAR_FARCASTER_USER_CACHE, verificationsCacheConfig);
		cacheConfigurations.put(FARCASTER_VERIFICATIONS_CACHE_NAME, verificationsCacheConfig);
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

		cacheManager.registerCustomCache(CONTACT_LIST_CACHE_NAME,
				buildCache(contactsListExpireAfterWriteDuration));

		cacheManager.registerCustomCache(FAN_TOKENS_CACHE_NAME,
				buildCache(contactsListExpireAfterWriteDuration));

		cacheManager.registerCustomCache(FAN_TOKEN_CACHE_NAME,
				buildCache(Duration.ofMinutes(5)));

		cacheManager.registerCustomCache(SOCIALS_CACHE_NAME,
				buildCache(socialsExpireAfterWriteDuration, socialsMaxSize));

		cacheManager.registerCustomCache(SOCIALS_INSIGHTS_CACHE_NAME,
				buildCache(socialsExpireAfterWriteDuration, socialsMaxSize));

		cacheManager.registerCustomCache(FARCASTER_VERIFICATIONS_CACHE_NAME,
				buildCache(verificationsExpireAfterWriteDuration, socialsMaxSize));

		cacheManager.registerCustomCache(NEYNAR_FARCASTER_USER_CACHE,
				buildCache(verificationsExpireAfterWriteDuration, socialsMaxSize));

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
