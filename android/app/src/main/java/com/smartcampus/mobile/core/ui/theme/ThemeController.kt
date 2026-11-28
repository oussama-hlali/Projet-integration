package com.smartcampus.mobile.core.ui.theme

import com.smartcampus.mobile.core.datastore.UserPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** Petit état partagé : le réglage du profil est appliqué immédiatement au thème. */
class ThemeController(private val prefs: UserPreferences) {

    private val _mode = MutableStateFlow("SYSTEM")
    val mode: StateFlow<String> = _mode.asStateFlow()

    suspend fun load() {
        _mode.value = prefs.theme()
    }

    suspend fun setMode(mode: String) {
        prefs.saveTheme(mode)
        _mode.value = mode
    }
}
