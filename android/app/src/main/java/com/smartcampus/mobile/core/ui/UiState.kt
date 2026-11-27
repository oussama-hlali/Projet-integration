package com.smartcampus.mobile.core.ui

/**
 * État simple et facile à lire pour chaque écran.
 */
data class ScreenUiState<T>(
    val loading: Boolean = false,
    val items: List<T> = emptyList(),
    val error: String? = null,
    val message: String? = null
)

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val challengeId: String? = null,
    val setupRequired: Boolean = false,
    val setupSecret: String = "",
    val setupUri: String = "",
    val navigateTo: String? = null
)
