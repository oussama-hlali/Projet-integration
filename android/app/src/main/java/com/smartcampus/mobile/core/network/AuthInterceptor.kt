package com.smartcampus.mobile.core.network

import okhttp3.Interceptor
import okhttp3.Response

/**
 * Ajoute le header Authorization sur les appels protégés.
 * Les appels publics d’auth n’en ont pas besoin.
 */
class AuthInterceptor(
    private val tokenHolder: TokenHolder
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val path = request.url.encodedPath

        val publicAuthCall =
            path.contains("/auth/login") ||
                path.contains("/auth/register") ||
                path.contains("/auth/mfa") ||
                path == "/api/v1/auth/refresh" ||
                path == "/api/v1/auth/logout"

        val token = tokenHolder.accessToken

        val finalRequest = if (!publicAuthCall && token != null) {
            request.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            request
        }

        return chain.proceed(finalRequest)
    }
}
