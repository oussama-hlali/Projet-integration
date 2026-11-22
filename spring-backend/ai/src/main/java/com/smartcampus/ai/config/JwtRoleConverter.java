package com.smartcampus.ai.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Collection;
import java.util.List;

/**
 * Maps the {@code role} claim issued by the identity service to a Spring
 * Security authority. The gateway forwards the original JWT, so every
 * downstream service that needs role checks must convert it locally.
 */
public class JwtRoleConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Object claim = jwt.getClaim("role");
        Collection<GrantedAuthority> authorities = claim == null
                ? List.of()
                : List.of(new SimpleGrantedAuthority("ROLE_" + claim.toString()));
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }
}
