package com.smartcampus.mobile.core.network

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.smartcampus.mobile.BuildConfig
import com.smartcampus.mobile.core.network.ApiServices.AuthApi
import com.smartcampus.mobile.core.network.ApiServices.SmartApi
import okhttp3.OkHttpClient
import okhttp3.ResponseBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

/**
 * Configuration centrale de Retrofit et OkHttp.
 */
class ApiClient(
    cookieJar: SessionCookieJar,
    authInterceptor: AuthInterceptor
) {

    val gson: Gson = GsonBuilder()
        .serializeNulls()
        .create()

    private val logging = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BASIC
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val okHttp = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .addInterceptor(authInterceptor)
        .addInterceptor(logging)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(okHttp)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()

    val authApi: AuthApi = retrofit.create(AuthApi::class.java)

    val smartApi: SmartApi = retrofit.create(SmartApi::class.java)

    fun parseError(body: ResponseBody?): String {
        if (body == null) return "Erreur serveur"
        return try {
            val problem = gson.fromJson(body.string(), ProblemDetails::class.java)
            problem?.readable() ?: "Erreur serveur"
        } catch (_: Exception) {
            "Erreur serveur"
        }
    }
}
