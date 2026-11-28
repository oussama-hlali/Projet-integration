package com.smartcampus.mobile.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.feature.auth.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val userId: String = "",
    val email: String = "",
    val role: String = "",
    val loading: Boolean = true,
    val error: String? = null,
    val navigateTo: String? = null,
)

/** L’écran d’accueil ne touche ni au repository ni à DataStore : tout passe ici. */
class HomeViewModel(
    private val repository: AuthRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    /** Relit les préférences à chaque retour sur l’accueil. */
    fun refresh() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true)
            val id = prefs.userId().orEmpty()
            val email = prefs.userEmail()?.takeIf { it.isNotBlank() } ?: id
            _state.value = _state.value.copy(
                userId = id,
                email = email,
                role = prefs.role(),
                loading = false,
            )
        }
    }

    fun openRooms() {
        _state.value = _state.value.copy(navigateTo = "rooms")
    }

    fun openReservations() {
        _state.value = _state.value.copy(navigateTo = "reservations")
    }

    fun logout() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true)
            repository.logout()
            _state.value = _state.value.copy(loading = false, navigateTo = "login")
        }
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }
}
