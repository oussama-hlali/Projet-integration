@file:OptIn(ExperimentalTextApi::class)

package com.smartcampus.mobile.feature.splash

import androidx.compose.animation.animateFloatAsState
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartcampus.mobile.core.ui.theme.Accent
import com.smartcampus.mobile.core.ui.theme.AccentBright
import com.smartcampus.mobile.core.ui.theme.FacetBottomLeft
import com.smartcampus.mobile.core.ui.theme.FacetBottomRight
import com.smartcampus.mobile.core.ui.theme.FacetTopLeft
import com.smartcampus.mobile.core.ui.theme.FacetTopRight
import com.smartcampus.mobile.core.ui.theme.GhostInk
import com.smartcampus.mobile.core.ui.theme.GrainInk
import com.smartcampus.mobile.core.ui.theme.Ink
import com.smartcampus.mobile.core.ui.theme.SplashCanvas
import kotlinx.coroutines.delay
import kotlin.random.Random

private const val FADE_MS = 500

/**
 * Splash mobile aligné sur le splash web PR #88 :
 * canvas clair, ghost CAMPUS, grain, plumbob à facettes + halos,
 * titre Smart / Campus, ◆ 2026, enter et particules.
 *
 * Le curseur custom du web n’a pas de sens sur mobile et n’est donc pas repris.
 */
@Composable
fun SplashScreen(
    viewModel: SplashViewModel,
    onReady: (authenticated: Boolean) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var navigated by remember { mutableStateOf(false) }

    val alpha by animateFloatAsState(
        targetValue = if (state.leaving) 0f else 1f,
        animationSpec = tween(FADE_MS),
    )

    LaunchedEffect(state.ready) {
        if (state.ready && !navigated) {
            navigated = true
            delay(FADE_MS.toLong())
            onReady(state.authenticated)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SplashCanvas)
            .alpha(alpha),
    ) {
        GhostText()
        Grain()
        Particles()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            GemWithHalos()

            Spacer(Modifier.height(28.dp))

            Title()

            Spacer(Modifier.height(8.dp))

            YearLine()

            Spacer(Modifier.height(28.dp))

            EnterButton(onClick = viewModel::enter)
        }
    }
}

@Composable
private fun GhostText() {
    Text(
        text = "CAMPUS",
        color = GhostInk,
        fontSize = 84.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = (-6).sp,
        maxLines = 1,
        softWrap = false,
        modifier = Modifier.align(Alignment.Center),
    )
}

@Composable
private fun Grain() {
    val points = remember {
        val random = Random(42)
        List(140) { random.nextFloat() to random.nextFloat() }
    }

    Canvas(modifier = Modifier.fillMaxSize()) {
        points.forEach { (x, y) ->
            drawCircle(
                color = GrainInk,
                radius = 1f,
                center = Offset(x * size.width, y * size.height),
            )
        }
    }
}

@Composable
private fun Particles() {
    val colors = listOf(
        Accent,
        Color(0xFF14B8A6),
        AccentBright,
        Color(0xFF38BDF8),
        Ink,
    )
    val glyphs = listOf(
        Triple(0.14f, 0.63f, "§"),
        Triple(0.24f, 0.71f, "✦"),
        Triple(0.38f, 0.66f, "§"),
        Triple(0.63f, 0.69f, "✦"),
        Triple(0.76f, 0.62f, "§"),
        Triple(0.87f, 0.74f, "✦"),
    )

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        glyphs.forEachIndexed { index, (x, y, glyph) ->
            Text(
                text = glyph,
                color = colors[index % colors.size],
                fontSize = (12 + (index % 3) * 2).sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.offset(x = maxWidth * x, y = maxHeight * y),
            )
        }
    }
}

@Composable
private fun GemWithHalos() {
    val transition = rememberInfiniteTransition()
    val bob by transition.animateFloat(
        initialValue = 0f,
        targetValue = -14f,
        animationSpec = infiniteRepeatable(tween(1800), RepeatMode.Reverse),
    )
    val haloScale by transition.animateFloat(
        initialValue = 1f,
        targetValue = 1.12f,
        animationSpec = infiniteRepeatable(tween(1300), RepeatMode.Reverse),
    )

    Box(
        modifier = Modifier
            .size(220.dp)
            .graphicsLayer { translationY = bob },
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .size(180.dp)
                .graphicsLayer {
                    scaleX = haloScale
                    scaleY = haloScale
                }
                .clip(CircleShape)
                .border(
                    BorderStroke(1.5.dp, Accent.copy(alpha = 0.26f)),
                    CircleShape,
                ),
        )

        Box(
            modifier = Modifier
                .size(240.dp)
                .graphicsLayer {
                    scaleX = haloScale
                    scaleY = haloScale
                }
                .clip(CircleShape)
                .border(
                    BorderStroke(1.dp, Accent.copy(alpha = 0.1f)),
                    CircleShape,
                ),
        )

        Plumbob()
    }
}

@Composable
private fun Plumbob() {
    Canvas(modifier = Modifier.size(120.dp, 220.dp)) {
        fun mapX(value: Float): Float = (value + 120f) / 240f * size.width
        fun mapY(value: Float): Float = (value + 230f) / 460f * size.height

        fun facet(points: List<Offset>): Path = Path().apply {
            moveTo(points[0].x, points[0].y)
            points.drop(1).forEach { lineTo(it.x, it.y) }
            close()
        }

        val facets = listOf(
            facet(
                listOf(
                    Offset(mapX(0f), mapY(-181.3f)),
                    Offset(mapX(98f), mapY(0f)),
                    Offset(mapX(0f), mapY(0f)),
                ),
            ) to FacetTopRight,
            facet(
                listOf(
                    Offset(mapX(0f), mapY(-181.3f)),
                    Offset(mapX(0f), mapY(0f)),
                    Offset(mapX(-98f), mapY(0f)),
                ),
            ) to FacetTopLeft,
            facet(
                listOf(
                    Offset(mapX(0f), mapY(181.3f)),
                    Offset(mapX(0f), mapY(0f)),
                    Offset(mapX(98f), mapY(0f)),
                ),
            ) to FacetBottomRight,
            facet(
                listOf(
                    Offset(mapX(0f), mapY(181.3f)),
                    Offset(mapX(-98f), mapY(0f)),
                    Offset(mapX(0f), mapY(0f)),
                ),
            ) to FacetBottomLeft,
        )

        facets.forEach { (path, color) ->
            drawPath(path = path, color = color)
            drawPath(
                path = path,
                color = Ink.copy(alpha = 0.13f),
                style = Stroke(width = 1.2f),
            )
        }
    }
}

@Composable
private fun Title() {
    Row(verticalAlignment = Alignment.Baseline) {
        Text(
            text = "Smart",
            style = TextStyle(
                fontSize = 40.sp,
                fontWeight = FontWeight.Bold,
                brush = Brush.linearGradient(listOf(Ink, Accent, Ink)),
            ),
        )
        Spacer(Modifier.width(6.dp))
        Text(
            text = "Campus",
            style = TextStyle(
                fontSize = 40.sp,
                fontWeight = FontWeight.Bold,
                color = Ink,
                drawStyle = Stroke(width = 2f),
            ),
        )
    }
}

@Composable
private fun YearLine() {
    val transition = rememberInfiniteTransition()
    val pop by transition.animateFloat(
        initialValue = 1f,
        targetValue = 1.4f,
        animationSpec = infiniteRepeatable(tween(1200), RepeatMode.Reverse),
    )

    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = "◆",
            color = Accent,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.graphicsLayer {
                scaleX = pop
                scaleY = pop
            },
        )
        Spacer(Modifier.width(2.dp))
        Text(
            text = "2026",
            color = Ink.copy(alpha = 0.5f),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
        )
    }
}

@Composable
private fun EnterButton(onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        border = BorderStroke(1.5.dp, Ink),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = SplashCanvas,
            contentColor = Ink,
        ),
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(Accent),
        )
        Spacer(Modifier.width(8.dp))
        Text(
            text = "enter",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
        )
    }
}
