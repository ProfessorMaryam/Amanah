package com.amanah.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    @Value("${supabase.jwks.url}")
    private String jwksUrl;

    private final Map<String, PublicKey> keyCache = new ConcurrentHashMap<>();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Skip filter for CORS preflight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            String headerJson = new String(Base64.getUrlDecoder().decode(token.split("\\.")[0]));
            JsonNode header = objectMapper.readTree(headerJson);
            String kid = header.path("kid").asText(null);
            log.debug("JWT kid: {}, alg: {}", kid, header.path("alg").asText());

            PublicKey publicKey = resolvePublicKey(kid);

            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .clockSkewSeconds(60)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            log.debug("JWT claims: sub={}, exp={}", claims.getSubject(), claims.getExpiration());

            UUID userId = UUID.fromString(claims.getSubject());
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.info("Authenticated userId: {}", userId);

        } catch (Exception e) {
            log.warn("JWT validation failed — type: {}, message: {}", e.getClass().getSimpleName(), e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid or expired token\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private PublicKey resolvePublicKey(String kid) throws Exception {
        if (kid != null && keyCache.containsKey(kid)) {
            return keyCache.get(kid);
        }

        log.debug("Fetching JWKS from {}", jwksUrl);
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(jwksUrl)).GET().build();
        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        log.debug("JWKS response status: {}, body: {}", res.statusCode(), res.body());

        JsonNode jwks = objectMapper.readTree(res.body());

        // Get P-256 ECParameterSpec via named curve
        AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
        params.init(new ECGenParameterSpec("secp256r1"));
        ECParameterSpec ecSpec = params.getParameterSpec(ECParameterSpec.class);

        for (JsonNode jwk : jwks.path("keys")) {
            String keyId = jwk.path("kid").asText(null);
            String kty = jwk.path("kty").asText();
            String crv = jwk.path("crv").asText();

            log.debug("JWKS key: kid={}, kty={}, crv={}", keyId, kty, crv);

            if (!"EC".equals(kty) || !"P-256".equals(crv)) continue;

            byte[] xBytes = Base64.getUrlDecoder().decode(jwk.path("x").asText());
            byte[] yBytes = Base64.getUrlDecoder().decode(jwk.path("y").asText());

            ECPoint point = new ECPoint(new BigInteger(1, xBytes), new BigInteger(1, yBytes));
            ECPublicKeySpec spec = new ECPublicKeySpec(point, ecSpec);
            PublicKey publicKey = KeyFactory.getInstance("EC").generatePublic(spec);

            if (keyId != null) {
                keyCache.put(keyId, publicKey);
                log.info("Cached public key for kid={}", keyId);
            }

            if (kid == null || kid.equals(keyId)) {
                return publicKey;
            }
        }

        throw new IllegalStateException("No matching public key found in JWKS for kid=" + kid);
    }
}
