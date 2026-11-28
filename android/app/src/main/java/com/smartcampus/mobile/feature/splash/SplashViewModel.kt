package com.smartcampus.mobile.feature.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.feature.auth.AuthRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** Same timing as the web splash: automatic hand-over after 8 seconds. */
private const val AUTO_ENTER_MS = 8000L

data class SplashUiState(
    val ready: Boolean = false,
    val authenticated: Boolean = false,
    val leaving: Boolean = false,
)

/**
 * Strict MVVM: the screen only renders this state and forwards the ENTER click.
 * The repository and DataStore stay outside the Composable.
 */
class SplashViewModel(
    private val repository: AuthRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(SplashUiState())
    val state: StateFlow<SplashUiState> = _state.asStateFlow()

    private var sessionResult: Boolean? = null
    private var enterRequested = false

    init {
        viewModelScope.launch {
            val hasSessionHint = prefs.sessionHint()
            val authenticated = if (hasSessionHint) {
                repository.refreshIfNeeded() != null
            } else {
                false
            }

            sessionResult = authenticated

            if (enterRequested) {
                finish(authenticated)
            } else {
                delay(AUTO_ENTER_MS)
                finish(authenticated)
            }
        }
    }

    /** ENTER on the splash goes home for a restored session, to login otherwise. */
    fun enter() {
        enterRequested = true
        sessionResult?.let { finish(it) }
    }

    private fun finish(authenticated: Boolean) {
        if (_state.value.ready) {
            return
        }
        _state.value = SplashUiState(
            ready = true,
            authenticated = authenticated,
            leaving = true,
        )
    }
}
