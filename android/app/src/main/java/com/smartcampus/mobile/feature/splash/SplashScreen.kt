package com.smartcampus.mobile.feature.splash

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.ui.components.LoadingBox
import com.smartcampus.mobile.feature.auth.AuthRepository

@Composable
fun SplashScreen(
    repository: AuthRepository,
    prefs: UserPreferences,
    onReady: (authenticated: Boolean) -> Unit
) {
    LaunchedEffect(Unit) {
        val hasSessionHint = prefs.sessionHint()
        val authenticated = if (hasSessionHint) {
            repository.refreshIfNeeded() != null
        } else {
            false
        }
        onReady(authenticated)
    }

    LoadingBox("Ouverture de Smart Campus…")
}
