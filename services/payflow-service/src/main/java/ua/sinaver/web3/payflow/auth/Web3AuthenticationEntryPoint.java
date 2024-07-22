package ua.sinaver.web3.payflow.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.io.IOException;

@Slf4j
@ControllerAdvice
public class Web3AuthenticationEntryPoint implements AuthenticationEntryPoint {
	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
	                     AuthenticationException authException)
			throws IOException {
		log.error("Exception at API: {} - {}", request.getRequestURI(), authException.getMessage());
		// 401
		response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication Failed");
	}

	@ExceptionHandler(value = {AccessDeniedException.class})
	public void commence(HttpServletRequest request, HttpServletResponse response,
	                     AccessDeniedException accessDeniedException) throws IOException {
		log.error("Exception at API: {}", request.getRequestURI(), accessDeniedException);
		// 403
		response.sendError(HttpServletResponse.SC_FORBIDDEN,
				"Authorization Failed : " + accessDeniedException.getMessage());
	}

	@ExceptionHandler(value = {Exception.class, Throwable.class})
	public void commence(HttpServletRequest request, HttpServletResponse response,
	                     Exception exception) throws IOException {
		log.error("Exception at API: {}", request.getRequestURI(), exception);
		// 500
		response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
				"Internal Server Error : " + exception.getMessage());
	}
}
