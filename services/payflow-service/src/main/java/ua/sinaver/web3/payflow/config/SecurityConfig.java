package ua.sinaver.web3.payflow.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.RequestCacheConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import ua.sinaver.web3.payflow.auth.*;

@Configuration
public class SecurityConfig {

	@Autowired
	private HandleAuthenticationEntryPoint authenticationEntryPoint;

	@Autowired
	private CustomAccessDeniedHandler accessDeniedHandler;

	@Autowired
	private Web3AuthenticationProvider web3AuthProvider;

	@Autowired
	private JwtAuthenticationFilter jwtAuthenticationFilter;

	@Autowired
	private ClientApiKeyAuthFilter clientApiKeyAuthFilter;

	@Bean
	@Order(1)
	SecurityFilterChain protocolFilterChain(HttpSecurity http) throws Exception {
		return http
				.securityMatcher("/protocol/**")
				.csrf(AbstractHttpConfigurer::disable)
				.sessionManagement(session -> session
						.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.requestCache(RequestCacheConfigurer::disable)
				.authorizeHttpRequests(requests -> requests
						.anyRequest().authenticated())
				.addFilterBefore(clientApiKeyAuthFilter, UsernamePasswordAuthenticationFilter.class)
				.exceptionHandling(exception -> exception
						.authenticationEntryPoint(authenticationEntryPoint)
						.accessDeniedHandler(accessDeniedHandler))
				.build();
	}

	@Bean
	@Order(2)
	SecurityFilterChain appFilterChain(HttpSecurity http, AuthenticationManager authenticationManager)
			throws Exception {
		return http
				.securityMatcher("/**")
				.csrf(AbstractHttpConfigurer::disable)
				.cors(Customizer.withDefaults())
				.requestCache(RequestCacheConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.authorizeHttpRequests(requests -> requests
						// siwe
						.requestMatchers(HttpMethod.GET, "/auth/nonce").permitAll()
						.requestMatchers(HttpMethod.POST, "/auth/verify/{identity}").permitAll()
						// flow payment
						.requestMatchers(HttpMethod.GET, "/flows/{uuid}").permitAll()
						.requestMatchers(HttpMethod.GET, "/flows/jar/{uuid}").permitAll()
						.requestMatchers(HttpMethod.GET, "/flows/wallets").permitAll()
						// payments
						.requestMatchers(HttpMethod.GET, "/payment").permitAll()
						.requestMatchers(HttpMethod.GET, "/payment/{referenceId}").permitAll()
						// request payment
						.requestMatchers(HttpMethod.GET, "/requests/{uuid}").permitAll()
						.requestMatchers(HttpMethod.POST, "/requests/{uuid}/proof").permitAll()
						// user
						// TODO: {username} behaves like a wildcard for other APIs, as well,
						// e.g. /user/all will get whitelisted too, a bit dangerous behaviour
						.requestMatchers(HttpMethod.GET, "/user/me").authenticated()
						.requestMatchers(HttpMethod.GET, "/user").permitAll()
						.requestMatchers(HttpMethod.GET, "/user/{identities}").permitAll()
						.requestMatchers(HttpMethod.GET, "/user/identities/{identity}").permitAll()
						.requestMatchers(HttpMethod.GET, "/user/identities/fid/{fid}").permitAll()
						.requestMatchers(HttpMethod.GET, "/user/{username}").permitAll()
						.requestMatchers(HttpMethod.GET, "/user/storage/fid/{fid}").permitAll()
						.requestMatchers(HttpMethod.POST, "/user/search/wallets").permitAll()
						// farcaster frames
						.requestMatchers(HttpMethod.POST, "/farcaster/frames/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/farcaster/frames/**").permitAll()
						// farcaster cast actions
						.requestMatchers(HttpMethod.POST, "/farcaster/actions/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/farcaster/actions/**").permitAll()
						// farcaster composer actions
						.requestMatchers(HttpMethod.POST, "/farcaster/composer/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/farcaster/composer/**").permitAll()
						// Farcaster webhooks
						.requestMatchers(HttpMethod.GET, "/farcaster/webhooks/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/farcaster/webhooks/**").permitAll()
						// Channel membership
						.requestMatchers(HttpMethod.GET, "/farcaster/membership/allowed").permitAll()
						// Tokens API
						.requestMatchers(HttpMethod.GET, "/tokens").permitAll()
						// Stats API
						.requestMatchers(HttpMethod.GET, "/stats/*").permitAll()
						.requestMatchers(HttpMethod.GET, "/error").permitAll()
						// other authenticated
						.anyRequest().authenticated())
				.sessionManagement(session -> session
						.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
				// set to false, so that context is saved into session automatically
				.securityContext(securityContext -> securityContext.requireExplicitSave(false))
				.authenticationManager(authenticationManager)
				.logout(logout -> logout
						.logoutUrl("/auth/logout")
						.deleteCookies("sessionId")
						.invalidateHttpSession(true)
						.clearAuthentication(true)
						.logoutSuccessHandler((httpServletRequest, httpServletResponse,
								authentication) -> {
							httpServletResponse.setStatus(HttpServletResponse.SC_OK);
						}))
				.addFilterAfter(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.exceptionHandling(exception -> exception
						.authenticationEntryPoint(authenticationEntryPoint)
						.accessDeniedHandler(accessDeniedHandler))
				.build();
	}

	@Bean
	AuthenticationManager authManager(HttpSecurity http) throws Exception {
		AuthenticationManagerBuilder authenticationManagerBuilder = http
				.getSharedObject(AuthenticationManagerBuilder.class);
		/*
		 * authenticationManagerBuilder.inMemoryAuthentication()
		 * .withUser("user")
		 * .password(passwordEncoder().encode("password"));
		 */
		authenticationManagerBuilder.authenticationProvider(web3AuthProvider);
		return authenticationManagerBuilder.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
