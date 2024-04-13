package ua.sinaver.web3.payflow.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import ua.sinaver.web3.payflow.auth.Web3AuthenticationEntryPoint;
import ua.sinaver.web3.payflow.auth.Web3AuthenticationProvider;

@Configuration
public class SecurityConfig {

	@Autowired
	private Web3AuthenticationEntryPoint web3EntryPoint;

	@Autowired
	private Web3AuthenticationProvider web3AuthProvider;

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, AuthenticationManager authenticationManager)
			throws Exception {
		return http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.requestCache(reqCache -> reqCache.disable())
				.httpBasic(basic -> basic.disable())
				.formLogin(form -> form.disable())
				.authorizeHttpRequests(requests -> requests
						// siwe
						.requestMatchers(HttpMethod.GET, "/auth/nonce").permitAll()
						.requestMatchers(HttpMethod.POST, "/auth/verify/{identity}").permitAll()
						// flow payment
						.requestMatchers(HttpMethod.GET, "/flows/{uuid}").permitAll()
						.requestMatchers(HttpMethod.GET, "/flows/jar/{uuid}").permitAll()
						.requestMatchers(HttpMethod.GET, "/flows/public/{username}").permitAll()
						// payments
						.requestMatchers(HttpMethod.GET, "/payment").permitAll()
						.requestMatchers(HttpMethod.GET, "/payment/{referenceId}").permitAll()
						// request payment
						.requestMatchers(HttpMethod.GET, "/requests/{uuid}").permitAll()
						.requestMatchers(HttpMethod.POST, "/requests/{uuid}/proof").permitAll()
						// user
						// TODO: {username} behaves like a wildcard for other APIs, as well,
						// e.g. /user/all will get whitelisted too, a bit dangerous behaviour
						.requestMatchers(HttpMethod.GET, "/user").permitAll()
						.requestMatchers(HttpMethod.GET, "/user/{identities}").permitAll()
						.requestMatchers(HttpMethod.GET, "/user/{username}").permitAll()
						.requestMatchers(HttpMethod.POST, "/user/search/wallets").permitAll()
						// farcaster frames
						.requestMatchers(HttpMethod.POST, "/farcaster/frames/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/farcaster/frames/**").permitAll()
						// farcaster actions
						.requestMatchers(HttpMethod.POST, "/farcaster/actions/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/farcaster/actions/**").permitAll()
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
				.exceptionHandling(exception -> exception
						.authenticationEntryPoint(web3EntryPoint))
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
