package com.smartcampus.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartcampus.mobile.core.navigation.AppNavHost
import com.smartcampus.mobile.core.ui.theme.SmartCampusTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val container = (application as SmartCampusApp).container

        setContent {
            val themeMode by container.themeController.mode.collectAsStateWithLifecycle()
            LaunchedEffect(Unit) {
                container.themeController.load()
            }
            val darkTheme = when (themeMode) {
                "LIGHT" -> false
                "DARK" -> true
                else -> isSystemInDarkTheme()
            }

            SmartCampusTheme(darkTheme = darkTheme) {
                AppNavHost(container = container)
            }
        }
    }
}
