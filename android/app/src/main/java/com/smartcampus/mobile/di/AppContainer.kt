package com.smartcampus.mobile.di

import android.content.Context
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.network.ApiClient
import com.smartcampus.mobile.core.network.AuthInterceptor
import com.smartcampus.mobile.core.network.SessionCookieJar
import com.smartcampus.mobile.core.network.TokenHolder
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import com.smartcampus.mobile.feature.auth.AuthRepository

/**
 * Conteneur simple, sans Hilt ni Koin.
 * Chaque objet est créé une seule fois quand l’application démarre.
 */
class AppContainer(private val context: Context) {

    val appContext: Context = context.applicationContext

    val tokenHolder = TokenHolder

    val cookieJar = SessionCookieJar()

    private val authInterceptor = AuthInterceptor(tokenHolder)

    val apiClient = ApiClient(cookieJar, authInterceptor)

    val prefs = UserPreferences(appContext)

    val authRepository = AuthRepository(
        api = apiClient.authApi,
        apiClient = apiClient,
        tokenHolder = tokenHolder,
        cookieJar = cookieJar,
        prefs = prefs
    )

    val smartCampusRepository = SmartCampusRepository(
        api = apiClient.smartApi,
        apiClient = apiClient
    )
}
