package ua.sinaver.web3.payflow.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ua.sinaver.web3.payflow.service.UserService;

import java.io.IOException;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	@Autowired
	private UserService userService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		log.debug("JwtAuthenticationFilter at path: {}", request.getRequestURI());

		// Skip processing if the user is already authenticated
		if (SecurityContextHolder.getContext().getAuthentication() != null
				&& SecurityContextHolder.getContext().getAuthentication().isAuthenticated()) {
			chain.doFilter(request, response);
			return;
		}

		val accessToken = extractToken(request);
		if (StringUtils.isNotBlank(accessToken)) {
			val user = userService.findByAccessToken(accessToken);
			if (user != null) {
				log.debug("Found user for accessToken: {}", user);
				val authentication = new Web3Authentication(
						user.getIdentity(), null, null);
				authentication.setAuthenticated(true);
				SecurityContextHolder.getContext().setAuthentication(authentication);
				userService.updateLastSeen(user);
				// userService.clearAccessToken(user);
			}
		}
		chain.doFilter(request, response);
	}

	/**
	 * Extracts the JWT token or simple access token from the Authorization header
	 * or query parameters.
	 *
	 * @param request the HTTP request
	 * @return the JWT token if present, otherwise null
	 */
	private String extractToken(HttpServletRequest request) {
		// 1. Attempt to extract from Authorization header
		String header = request.getHeader("Authorization");
		if (StringUtils.startsWithIgnoreCase(header, "Bearer ")) {
			String token = header.substring(7).trim();
			if (StringUtils.isNotBlank(token)) {
				return token;
			}
		}

		// 2. Fallback to access_token query parameter
		String accessToken = request.getParameter("access_token");
		if (StringUtils.isBlank(accessToken)) {
			accessToken = request.getParameter("accessToken");
		}
		if (StringUtils.isNotBlank(accessToken)) {
			log.debug("Using legacy access token from query parameter");
			return accessToken;
		}

		return null;
	}
}
