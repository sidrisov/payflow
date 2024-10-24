package ua.sinaver.web3.payflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Configuration
public class AsyncConfig implements AsyncConfigurer {

	@Override
	public Executor getAsyncExecutor() {
		return Executors.newVirtualThreadPerTaskExecutor();
	}
}
