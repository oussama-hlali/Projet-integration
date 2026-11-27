package com.smartcampus.mobile.feature.splash

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.ui.theme.Accent
import com.smartcampus.mobile.core.ui.theme.AccentBright
import com.smartcampus.mobile.core.ui.theme.AccentGlow
import com.smartcampus.mobile.core.ui.theme.Ink
import com.smartcampus.mobile.core.ui.theme.SplashCanvas
import com.smartcampus.mobile.feature.auth.AuthRepository

/**
 * Splash aligné sur le splash web Smart Campus :
 * canvas clair, halo teal, gem, titre "Smart Campus", "◆ 2026" et ENTER.
 *
 * UX Android : la vérification de session continue en arrière-plan.
 * ENTER permet d’aller directement au login sans attendre.
 */
@Composable
fun SplashScreen(
    repository: AuthRepository,
    prefs: UserPreferences,
    onReady: (authenticated: Boolean) -> Unit
) {
    var leaving by remember { mutableStateOf(false) }

    fun leave(authenticated: Boolean) {
        if (!leaving) {
            leaving = true
            onReady(authenticated)
        }
    }

    LaunchedEffect(Unit) {
        val hasSessionHint = prefs.sessionHint()
        val authenticated = if (hasSessionHint) {
            repository.refreshIfNeeded() != null
        } else {
            false
        }
        leave(authenticated)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SplashCanvas)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(AccentGlow, Color.Transparent)
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            GemMark()

            Spacer(Modifier.height(28.dp))

            Text(
                text = "Smart Campus",
                color = Ink,
                fontSize = 34.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-1).sp
            )

            Spacer(Modifier.height(6.dp))

            Text(
                text = "◆ 2026",
                color = Accent,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 4.sp
            )

            Spacer(Modifier.height(28.dp))

            OutlinedButton(
                onClick = { leave(false) },
                border = BorderStroke(1.dp, Accent),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Ink)
            ) {
                Text(
                    text = "ENTER",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 3.sp
                )
            }

            Spacer(Modifier.height(16.dp))

            CircularProgressIndicator(
                modifier = Modifier.size(18.dp),
                color = Accent,
                strokeWidth = 2.dp
            )
        }
    }
}

@Composable
private fun GemMark() {
    Canvas(modifier = Modifier.size(88.dp, 132.dp)) {
        val gem = Path().apply {
            moveTo(size.width / 2f, 0f)
            lineTo(size.width, size.height * 0.38f)
            lineTo(size.width / 2f, size.height * 0.51f)
            lineTo(0f, size.height * 0.38f)
            close()
        }

        drawPath(
            path = gem,
            brush = Brush.linearGradient(
                colors = listOf(
                    AccentBright,
                    Accent,
                    Color(0xFF084C4A)
                )
            )
        )
    }
}
