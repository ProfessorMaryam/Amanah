package com.amanah.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URL;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Value("${supabase.url:https://jkobgqcoednzpbfktogj.supabase.co}")
    private String supabaseUrl;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        System.out.println("[JwtAuthFilter] Request path: " + request.getRequestURI());
        System.out.println("[JwtAuthFilter] Authorization header exists: " + (authHeader != null));
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("[JwtAuthFilter] No valid Authorization header, proceeding without auth");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        System.out.println("[JwtAuthFilter] Token found, length: " + token.length());

        try {
            // Manually parse JWT payload without signature verification
            // For production, implement full JWKS verification
            // Format: header.payload.signature
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid JWT format");
            }

            // Decode the payload part (second part)
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            System.out.println("[JwtAuthFilter] JWT payload decoded successfully");

            // Parse JSON payload
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> claims = mapper.readValue(payload, Map.class);
            
            // Check token expiration (with 60 second grace period for clock skew)
            Long exp = ((Number) claims.get("exp")).longValue();
            Long now = System.currentTimeMillis() / 1000;
            Long clockSkewSeconds = 60L;
            
            if (exp < (now - clockSkewSeconds)) {
                System.out.println("[JwtAuthFilter] ✗ Token expired (exp: " + exp + ", now: " + now + ")");
                throw new IllegalArgumentException("Token expired");
            }
            
            if (exp < now) {
                System.out.println("[JwtAuthFilter] ⚠️ Token near expiration (exp: " + exp + ", now: " + now + ", grace: " + clockSkewSeconds + "s)");
            }
            
            String subject = (String) claims.get("sub"); // Supabase user UUID
            System.out.println("[JwtAuthFilter] ✓ Token valid, userId: " + subject);
            
            // Verify subject is a valid UUID
            UUID userId = UUID.fromString(subject);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);
            System.out.println("[JwtAuthFilter] ✓ Authentication set for userId: " + userId);

        } catch (Exception e) {
            System.out.println("[JwtAuthFilter] ✗ JWT extraction failed: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Invalid or expired token: " + e.getMessage() + "\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
