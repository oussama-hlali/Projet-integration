package com.smartcampus.mobile.feature.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.feature.auth.AuthRepository
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    repository: AuthRepository,
    prefs: UserPreferences,
    onLogout: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        email = prefs.userId().orEmpty()
        role = prefs.role()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("Accueil Smart Campus", style = MaterialTheme.typography.titleLarge)

        Spacer(Modifier.height(16.dp))

        Text("Identifiant utilisateur : $email")
        Text("Rôle : $role")

        Spacer(Modifier.height(16.dp))

        Text(
            text = "Les écrans Salles, Réservations, Événements et Cafétéria seront ajoutés dans la partie suivante.",
            style = MaterialTheme.typography.bodyMedium
        )

        Spacer(Modifier.height(24.dp))

        OutlinedButton(
            onClick = { /* À brancher dans la partie 2 */ },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Voir les salles — bientôt")
        }

        Spacer(Modifier.height(12.dp))

        Button(
            onClick = {
                scope.launch {
                    repository.logout()
                    onLogout()
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Se déconnecter")
        }
    }
}
