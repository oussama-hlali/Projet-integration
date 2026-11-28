package com.smartcampus.mobile.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.ui.theme.ThemeController
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val name: String = "",
    val email: String = "",
    val role: String = "",
    val theme: String = "SYSTEM",
    val language: String = "FR",
    val notificationsEnabled: Boolean = true,
    val loading: Boolean = true,
)

/** Profil et préférences : toute écriture DataStore passe par ce ViewModel. */
class ProfileViewModel(
    private val prefs: UserPreferences,
    private val themeController: ThemeController,
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true)
            val theme = prefs.theme()
            themeController.load()
            _state.value = _state.value.copy(
                name = prefs.userName().orEmpty(),
                email = prefs.userEmail().orEmpty(),
                role = prefs.role(),
                theme = theme,
                language = prefs.language(),
                notificationsEnabled = prefs.notificationsEnabled(),
                loading = false,
            )
        }
    }

    fun setTheme(mode: String) {
        if (mode !in listOf("SYSTEM", "LIGHT", "DARK")) return
        viewModelScope.launch {
            themeController.setMode(mode)
            _state.value = _state.value.copy(theme = mode)
        }
    }

    fun setLanguage(value: String) {
        if (value !in listOf("FR", "EN")) return
        viewModelScope.launch {
            prefs.saveLanguage(value)
            _state.value = _state.value.copy(language = value)
        }
    }

    fun setNotificationsEnabled(value: Boolean) {
        viewModelScope.launch {
            prefs.saveNotificationsEnabled(value)
            _state.value = _state.value.copy(notificationsEnabled = value)
        }
    }
}
