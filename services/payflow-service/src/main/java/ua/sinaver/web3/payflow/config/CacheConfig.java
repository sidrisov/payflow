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
	public static final String CACHE_PREFIX = "v0:";
	public static final String CONTACTS_CACHE_NAME = CACHE_PREFIX + "contacts";
	public static final String CONTACT_LIST_CACHE_NAME = CACHE_PREFIX + "contact-list";
	public static final String SOCIALS_CACHE_NAME = CACHE_PREFIX + "socials";
	public static final String SOCIALS_INSIGHTS_CACHE_NAME = CACHE_PREFIX + "insights";
	public static final String FARCASTER_VERIFICATIONS_CACHE_NAME = CACHE_PREFIX + "verifications";
	public static final String TOKEN_OWNERS_CACHE_NAME = CACHE_PREFIX + "token-owners";
	public static final String POAP_OWNERS_CACHE_NAME = CACHE_PREFIX + "poap-owners";
	public static final String USERS_CACHE_NAME = CACHE_PREFIX + "users";
	public static final String INVITATIONS_CACHE_NAME = CACHE_PREFIX + "invitations";
	public static final String NEYNAR_FARCASTER_USER_CACHE = CACHE_PREFIX + "farcaster-users";


	@Value("${spring.cache.contacts.eth-denver.expireAfterWrite:10m}")
	private Duration poapAndTokenOwnersExpireAfterWriteDuration;
	@Value("${spring.cache.contacts.all.expireAfterWrite:10m}")
	private Duration contactsExpireAfterWriteDuration;
	@Value("${spring.cache.contacts.list.expireAfterWrite:10m}")
	private Duration contactsListExpireAfterWriteDuration;
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

		val ethDenverContactsCacheConfigs =
				RedisCacheConfiguration.defaultCacheConfig()
						.disableCachingNullValues()
						.entryTtl(poapAndTokenOwnersExpireAfterWriteDuration)
						.serializeValuesWith(RedisSerializationContext
								.SerializationPair
								.fromSerializer(serializer));

		val socialsCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues()
				.entryTtl(socialsExpireAfterWriteDuration)
				.serializeValuesWith(RedisSerializationContext
						.SerializationPair
						.fromSerializer(serializer));

		val cacheConfigurations = new HashMap<String, RedisCacheConfiguration>();
		cacheConfigurations.put(CONTACTS_CACHE_NAME, contactsCacheConfigs);
		cacheConfigurations.put(CONTACT_LIST_CACHE_NAME, contactsListCacheConfigs);
		cacheConfigurations.put(TOKEN_OWNERS_CACHE_NAME, ethDenverContactsCacheConfigs);
		cacheConfigurations.put(POAP_OWNERS_CACHE_NAME, ethDenverContactsCacheConfigs);
		cacheConfigurations.put(SOCIALS_CACHE_NAME, socialsCacheConfig);
		cacheConfigurations.put(SOCIALS_INSIGHTS_CACHE_NAME, socialsCacheConfig);
		cacheConfigurations.put(NEYNAR_FARCASTER_USER_CACHE, socialsCacheConfig);
		cacheConfigurations.put(FARCASTER_VERIFICATIONS_CACHE_NAME, socialsCacheConfig);
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

		cacheManager.registerCustomCache(TOKEN_OWNERS_CACHE_NAME,
				buildCache(poapAndTokenOwnersExpireAfterWriteDuration));

		cacheManager.registerCustomCache(POAP_OWNERS_CACHE_NAME,
				buildCache(poapAndTokenOwnersExpireAfterWriteDuration));

		cacheManager.registerCustomCache(SOCIALS_CACHE_NAME,
				buildCache(socialsExpireAfterWriteDuration, socialsMaxSize));

		cacheManager.registerCustomCache(SOCIALS_INSIGHTS_CACHE_NAME,
				buildCache(socialsExpireAfterWriteDuration, socialsMaxSize));

		cacheManager.registerCustomCache(FARCASTER_VERIFICATIONS_CACHE_NAME,
				buildCache(socialsExpireAfterWriteDuration, socialsMaxSize));

		cacheManager.registerCustomCache(NEYNAR_FARCASTER_USER_CACHE,
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
