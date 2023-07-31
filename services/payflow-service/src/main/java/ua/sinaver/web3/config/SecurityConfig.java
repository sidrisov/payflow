package ua.sinaver.web3.config;

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

import jakarta.servlet.http.HttpServletResponse;
import ua.sinaver.web3.auth.Web3AuthenticationEntryPoint;
import ua.sinaver.web3.auth.Web3AuthenticationProvider;

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
                                .formLogin(form -> form.disable())
                                .authorizeHttpRequests(requests -> requests
                                                .requestMatchers(HttpMethod.GET, "/auth/nonce").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/auth/verify").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/flows/{uuid}").permitAll()
                                                .anyRequest()
                                                .authenticated())
                                // .httpBasic(Customizer.withDefaults())
                                .httpBasic(basic -> basic.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                                .securityContext(Customizer.withDefaults())
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
                authenticationManagerBuilder.inMemoryAuthentication()
                                .withUser("user")
                                .password(passwordEncoder().encode("password"));
                authenticationManagerBuilder.authenticationProvider(web3AuthProvider);
                return authenticationManagerBuilder.build();
        }

        @Bean
        PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

}
