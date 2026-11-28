package com.smartcampus.mobile.core.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.smartcampus.mobile.core.model.dto.UserDto
import kotlinx.coroutines.flow.first

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "smart_campus_prefs"
)

/**
 * Stockage simple des préférences et de l’indice de session.
 * Aucun token n’est stocké ici.
 */
class UserPreferences(private val context: Context) {

    private val store = context.applicationContext.dataStore

    companion object {
        val SESSION_HINT = booleanPreferencesKey("session_hint")
        val USER_ID = stringPreferencesKey("user_id")
        val USER_ROLE = stringPreferencesKey("user_role")
        val USER_NAME = stringPreferencesKey("user_name")
        val USER_EMAIL = stringPreferencesKey("user_email")
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val LANGUAGE = stringPreferencesKey("language")
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
        val LAST_ROOMS_FILTER = stringPreferencesKey("last_rooms_filter")
    }

    suspend fun sessionHint(): Boolean = store.data.first()[SESSION_HINT] ?: false

    suspend fun userId(): String? = store.data.first()[USER_ID]

    suspend fun userEmail(): String? = store.data.first()[USER_EMAIL]

    suspend fun roomsFilter(): String = store.data.first()[LAST_ROOMS_FILTER] ?: ""

    suspend fun saveRoomsFilter(value: String) {
        store.edit { prefs -> prefs[LAST_ROOMS_FILTER] = value }
    }

    suspend fun role(): String = store.data.first()[USER_ROLE] ?: "STUDENT"

    suspend fun saveSession(user: UserDto) {
        store.edit { prefs ->
            prefs[SESSION_HINT] = true
            prefs[USER_ID] = user.id
            prefs[USER_ROLE] = user.role
            prefs[USER_NAME] = user.fullName
            prefs[USER_EMAIL] = user.email
            prefs[NOTIFICATIONS_ENABLED] = user.notificationsEnabled
        }
    }

    suspend fun clearSession() {
        store.edit { prefs ->
            prefs.remove(SESSION_HINT)
            prefs.remove(USER_ID)
            prefs.remove(USER_ROLE)
            prefs.remove(USER_NAME)
            prefs.remove(USER_EMAIL)
        }
    }

    suspend fun saveTheme(mode: String) {
        store.edit { prefs -> prefs[THEME_MODE] = mode }
    }

    suspend fun theme(): String = store.data.first()[THEME_MODE] ?: "SYSTEM"
}
