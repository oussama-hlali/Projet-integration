package com.smartcampus.mobile.core.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Accent,
    onPrimary = Color.White,
    primaryContainer = AccentBright,
    onPrimaryContainer = Ink,
    surface = WebSurface,
    onSurface = Ink,
    surfaceVariant = WebSurfaceMuted,
    background = SplashCanvas,
    onBackground = Ink,
    error = ErrorRed
)

private val DarkColors = darkColorScheme(
    primary = DarkAccent,
    onPrimary = DarkCanvas,
    primaryContainer = Accent,
    onPrimaryContainer = Color.White,
    surface = DarkSurface,
    onSurface = Color.White,
    surfaceVariant = DarkSurface,
    background = DarkCanvas,
    onBackground = Color.White,
    error = ErrorRed
)

@Composable
fun SmartCampusTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors

    MaterialTheme(
        colorScheme = colors,
        typography = AppTypography,
        content = content
    )
}
