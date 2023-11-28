package ua.sinaver.web3;

import java.security.Security;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import io.micrometer.core.instrument.Clock;
import io.micrometer.core.instrument.logging.LoggingMeterRegistry;
import io.micrometer.core.instrument.logging.LoggingRegistryConfig;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "ua.sinaver.web3.repository")
@EntityScan(basePackages = "ua.sinaver.web3.data")
@ComponentScan(basePackages = "ua.sinaver.web3")
public class PayFlowApplication {

	static {
		Security.addProvider(new BouncyCastleProvider());
	}

	public static void main(String[] args) {
		SpringApplication.run(PayFlowApplication.class, args);
	}

	@Bean
	LoggingMeterRegistry loggingMeterRegistry(Environment env) {
		LoggingRegistryConfig config = key -> {
			String property = null;

			switch (key) {
				case "logging.enabled":
					property = "management.metrics.export.logging.enabled";
					break;

				case "logging.step":
					property = "management.metrics.export.logging.step";
					break;

			}

			return (null != property)
					? env.getProperty(property)
					: null;
		};

		return new LoggingMeterRegistry(config, Clock.SYSTEM);
	}
}
