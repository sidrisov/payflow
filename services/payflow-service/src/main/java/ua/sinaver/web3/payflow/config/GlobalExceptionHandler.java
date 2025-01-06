package ua.sinaver.web3.payflow.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException ex) {
		log.warn("Response status exception: {}", ex.getMessage());
		return new ResponseEntity<>(
				Map.of("error", ex.getReason()),
				ex.getStatusCode());
	}

	@ExceptionHandler({Exception.class, Throwable.class})
	public ResponseEntity<Map<String, String>> handleAllUncaughtException(Exception ex) {
		log.error("Unexpected error occurred", ex);
		return new ResponseEntity<>(
				Map.of("error", "An unexpected error occurred"),
				HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
