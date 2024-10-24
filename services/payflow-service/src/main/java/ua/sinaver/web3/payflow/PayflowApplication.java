package ua.sinaver.web3.payflow;

import io.micrometer.core.instrument.Clock;
import io.micrometer.core.instrument.logging.LoggingMeterRegistry;
import io.micrometer.core.instrument.logging.LoggingRegistryConfig;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.security.Security;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "ua.sinaver.web3.payflow.repository")
@EntityScan(basePackages = "ua.sinaver.web3.payflow.data")
@ComponentScan(basePackages = "ua.sinaver.web3.payflow")
@EnableCaching
@EnableScheduling
@EnableRetry
@EnableAsync(proxyTargetClass = true)
public class PayflowApplication {

	static {
		Security.addProvider(new BouncyCastleProvider());
	}

	public static void main(String[] args) {
		SpringApplication.run(PayflowApplication.class, args);
	}

	@Bean
	LoggingMeterRegistry loggingMeterRegistry(Environment env) {
		LoggingRegistryConfig config = key -> {
			String property = switch (key) {
				case "logging.enabled" -> "management.metrics.export.logging.enabled";
				case "logging.step" -> "management.metrics.export.logging.step";
				default -> null;
			};

			return (null != property)
					? env.getProperty(property)
					: null;
		};

		return new LoggingMeterRegistry(config, Clock.SYSTEM);
	}

	// TODO: doesn't seem to work, check later
	// @Bean
	// public RuntimeWiringConfigurer runtimeWiringConfigurer() {
	// return wiringBuilder -> wiringBuilder
	// .scalar(ExtendedScalars.newAliasedScalar("Identity")
	// .aliasedScalar(Scalars.GraphQLString)
	// .build()
	// )
	// .scalar(ExtendedScalars.newAliasedScalar("Address")
	// .aliasedScalar(Scalars.GraphQLString)
	// .build()
	// );
	// }
}
