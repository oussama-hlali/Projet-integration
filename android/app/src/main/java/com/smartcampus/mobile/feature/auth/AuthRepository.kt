package com.smartcampus.mobile.feature.auth

import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.model.dto.LoginRequest
import com.smartcampus.mobile.core.model.dto.MfaChallenge
import com.smartcampus.mobile.core.model.dto.MfaSetupResponse
import com.smartcampus.mobile.core.model.dto.MfaVerifyRequest
import com.smartcampus.mobile.core.model.dto.SessionResponse
import com.smartcampus.mobile.core.model.dto.UserDto
import com.smartcampus.mobile.core.network.ApiClient
import com.smartcampus.mobile.core.network.ApiServices.AuthApi
import com.smartcampus.mobile.core.network.SessionCookieJar
import com.smartcampus.mobile.core.network.TokenHolder
import retrofit2.HttpException
import java.io.IOException

/**
 * Repository authentification.
 * Le ViewModel ne connaît pas Retrofit : il appelle seulement ce repository.
 */
class AuthRepository(
    private val api: AuthApi,
    private val apiClient: ApiClient,
    private val tokenHolder: TokenHolder,
    private val cookieJar: SessionCookieJar,
    private val prefs: UserPreferences
) {

    suspend fun login(email: String, password: String): MfaChallenge {
        return safeCall { api.login(LoginRequest(email, password)) }
    }

    suspend fun mfaSetup(challengeId: String): MfaSetupResponse {
        return safeCall { api.mfaSetup(mapOf("challengeId" to challengeId)) }
    }

    suspend fun verifyMfa(challengeId: String, code: String): SessionResponse {
        val session = safeCall {
            api.verifyMfa(MfaVerifyRequest(challengeId, code))
        }
        tokenHolder.save(session.accessToken)
        prefs.saveSession(session.user)
        return session
    }

    suspend fun refreshIfNeeded(): UserDto? {
        return try {
            val session = api.refresh()
            tokenHolder.save(session.accessToken)
            prefs.saveSession(session.user)
            session.user
        } catch (_: Exception) {
            null
        }
    }

    suspend fun logout() {
        try {
            api.logout()
        } catch (_: Exception) {
            // Même si le serveur échoue, on nettoie la session locale.
        }
        tokenHolder.clear()
        cookieJar.clear()
        prefs.clearSession()
    }

    private suspend fun <T> safeCall(block: suspend () -> T): T {
        return try {
            block()
        } catch (e: HttpException) {
            val message = apiClient.parseError(e.response().errorBody())
            throw Exception(message)
        } catch (e: IOException) {
            throw Exception("Service indisponible")
        }
    }
}
