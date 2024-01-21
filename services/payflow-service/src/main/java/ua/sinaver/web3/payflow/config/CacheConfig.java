package ua.sinaver.web3.payflow.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CacheConfig {

	// TODO: either bind CaffeineSpec per cache or find out if nesting works automatically
	@Value("${spring.cache.contacts.expireAfterWrite:30m}")
	private Duration contactsExpireAfterWriteDuration;

	@Value("${spring.cache.socials.expireAfterWrite:1h}")
	private Duration socialsExpireAfterWriteDuration;

	@Bean
	public CacheManager cacheManager() {
		CaffeineCacheManager cacheManager = new CaffeineCacheManager();

		cacheManager.registerCustomCache("contacts",
				buildCache(contactsExpireAfterWriteDuration));

		cacheManager.registerCustomCache("socials",
				buildCache(socialsExpireAfterWriteDuration));

		cacheManager.registerCustomCache("socials",
				buildCache(socialsExpireAfterWriteDuration));

		cacheManager.registerCustomCache("users",
				buildCache(Duration.ofHours(24)));

		cacheManager.registerCustomCache("invitations",
				buildCache(Duration.ofHours(24)));

		return cacheManager;
	}

	private Cache buildCache(Duration expireAfterWrite) {
		return Caffeine.newBuilder()
				.expireAfterWrite(expireAfterWrite)
				.build();
	}
}
