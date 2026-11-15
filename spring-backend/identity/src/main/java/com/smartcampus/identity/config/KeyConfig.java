package com.smartcampus.identity.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

@Configuration
public class KeyConfig {

    /** Single RSA keypair for v1. Rotate by adding a new key and keeping the old one in JWKS. */
    @Bean
    public KeyPair rsaKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    @Bean
    public RSAPublicKey rsaPublicKey(KeyPair rsaKeyPair) {
        return (RSAPublicKey) rsaKeyPair.getPublic();
    }

    @Bean
    public RSAPrivateKey rsaPrivateKey(KeyPair rsaKeyPair) {
        return (RSAPrivateKey) rsaKeyPair.getPrivate();
    }
}
