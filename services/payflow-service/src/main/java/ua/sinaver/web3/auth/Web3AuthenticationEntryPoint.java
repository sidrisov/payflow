package ua.sinaver.web3.auth;

import java.io.IOException;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@ControllerAdvice
public class Web3AuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException)
            throws IOException, ServletException {
        // 401
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication Failed");
    }

    @ExceptionHandler(value = { AccessDeniedException.class })
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException, ServletException {
        // 403
        response.sendError(HttpServletResponse.SC_FORBIDDEN,
                "Authorization Failed : " + accessDeniedException.getMessage());
    }

    @ExceptionHandler(value = { Exception.class })
    public void commence(HttpServletRequest request, HttpServletResponse response,
            Exception exception) throws IOException, ServletException {
        // 500
        response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                "Internal Server Error : " + exception.getMessage());
    }
}
