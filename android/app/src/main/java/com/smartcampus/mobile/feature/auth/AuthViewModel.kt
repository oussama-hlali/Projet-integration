package com.smartcampus.mobile.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.ui.LoginUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel simple : il garde l’état de l’écran et appelle le repository.
 */
class AuthViewModel(
    private val repository: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    fun onEmailChange(value: String) {
        _state.value = _state.value.copy(email = value, error = null)
    }

    fun onPasswordChange(value: String) {
        _state.value = _state.value.copy(password = value, error = null)
    }

    fun login() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)

            try {
                val challenge = repository.login(
                    _state.value.email,
                    _state.value.password
                )

                _state.value = _state.value.copy(
                    loading = false,
                    challengeId = challenge.challengeId,
                    setupRequired = challenge.setupRequired,
                    navigateTo = if (challenge.setupRequired) "mfa_setup" else "mfa_verify"
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Connexion impossible"
                )
            }
        }
    }

    fun loadSetup() {
        val challengeId = _state.value.challengeId ?: return

        viewModelScope.launch {
            try {
                val setup = repository.mfaSetup(challengeId)
                _state.value = _state.value.copy(
                    setupSecret = setup.secret,
                    setupUri = setup.otpauthUri
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "Configuration MFA impossible"
                )
            }
        }
    }

    fun goToVerify() {
        _state.value = _state.value.copy(navigateTo = "mfa_verify")
    }

    fun verify(code: String) {
        val challengeId = _state.value.challengeId ?: return

        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)

            try {
                repository.verifyMfa(challengeId, code.trim())
                _state.value = _state.value.copy(
                    loading = false,
                    navigateTo = "home"
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Code TOTP invalide"
                )
            }
        }
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }
}
