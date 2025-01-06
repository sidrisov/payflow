package ua.sinaver.web3.payflow.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ua.sinaver.web3.payflow.service.ApiKeyAuthenticationService;
import java.io.IOException;

@Slf4j
@Component
public class ClientApiKeyAuthFilter extends OncePerRequestFilter {

	@Autowired
	private ApiKeyAuthenticationService apiKeyAuthenticationService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		if (request.getRequestURI().startsWith("/api/protocol")) {
			val apiKey = request.getHeader("X-API-Key");

			log.info("Protocol request authentication attempt - path: {}, apiKey: {}",
					request.getRequestURI(),
					apiKey != null ? apiKey.substring(0, 8) + "..." : "null");

			val clientApiKey = apiKeyAuthenticationService.validateApiKey(apiKey);

			if (clientApiKey == null) {
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				response.setContentType("application/json");
				response.getWriter().write("{\"error\":\"Invalid or missing API Key\"}");
				return;
			}

			// Create authentication with ClientApiKey
			val authentication = new ClientApiKeyAuthentication(clientApiKey);
			SecurityContextHolder.getContext().setAuthentication(authentication);
		}

		filterChain.doFilter(request, response);
	}

	@Data
	public static class ErrorResponse {
		private String error;
	}

}
