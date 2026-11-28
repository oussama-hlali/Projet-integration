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
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun HomeScreen(viewModel: HomeViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("Accueil Smart Campus", style = MaterialTheme.typography.titleLarge)

        Spacer(Modifier.height(16.dp))

        if (state.loading) {
            Text("Chargement du profil…", style = MaterialTheme.typography.bodyMedium)
        } else {
            Text("Identifiant utilisateur : ${state.email}")
            Text("Rôle : ${state.role}")
        }

        Spacer(Modifier.height(24.dp))

        OutlinedButton(
            onClick = viewModel::openRooms,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Voir les salles")
        }

        Spacer(Modifier.height(12.dp))

        OutlinedButton(
            onClick = viewModel::openReservations,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Mes réservations")
        }

        Spacer(Modifier.height(12.dp))

        OutlinedButton(
            onClick = viewModel::openEvents,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Événements")
        }

        Spacer(Modifier.height(12.dp))

        OutlinedButton(
            onClick = viewModel::openAnnouncements,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Annonces")
        }

        Spacer(Modifier.height(12.dp))

        OutlinedButton(
            onClick = viewModel::openNotifications,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Notifications")
        }

        Spacer(Modifier.height(12.dp))

        OutlinedButton(
            onClick = viewModel::openCafeteria,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Cafétéria")
        }

        Spacer(Modifier.height(12.dp))

        OutlinedButton(
            onClick = viewModel::openOrders,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Mes commandes")
        }

        Spacer(Modifier.height(12.dp))

        OutlinedButton(
            onClick = viewModel::openLostFound,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Objets perdus / trouvés")
        }

        Spacer(Modifier.height(12.dp))

        OutlinedButton(
            onClick = viewModel::openProfile,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Profil et préférences")
        }

        Spacer(Modifier.height(12.dp))

        Button(
            onClick = viewModel::logout,
            enabled = !state.loading,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (state.loading) "Déconnexion…" else "Se déconnecter")
        }
    }
}
