package com.smartcampus.mobile.core.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.smartcampus.mobile.di.AppContainer

/**
 * Version minimale pour la partie 1.
 * Elle sera remplacée par la navigation complète dans le commit de la partie UI.
 */
@Composable
fun AppNavHost(container: AppContainer) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "splash") {
        composable("splash") {
            PlaceholderScreen("Smart Campus — chargement…")
        }
        composable("login") {
            PlaceholderScreen("Écran de connexion")
        }
        composable("home") {
            PlaceholderScreen("Accueil Smart Campus")
        }
    }
}

@Composable
private fun PlaceholderScreen(text: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(text = text, style = MaterialTheme.typography.titleLarge)
    }
}
