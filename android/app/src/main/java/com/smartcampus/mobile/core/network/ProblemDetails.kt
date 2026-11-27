package com.smartcampus.mobile.core.network

import com.google.gson.annotations.SerializedName

/**
 * Format d’erreur renvoyé par le gateway Spring Boot.
 */
data class ProblemDetails(
    val type: String? = null,
    val title: String? = null,
    val status: Int? = null,
    val detail: String? = null,
    @SerializedName("code")
    val code: String? = null
) {

    fun readable(): String {
        return detail?.takeIf { it.isNotBlank() }
            ?: title?.takeIf { it.isNotBlank() }
            ?: "Erreur serveur"
    }
}
