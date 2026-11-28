package com.smartcampus.mobile.feature.rooms

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
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartcampus.mobile.core.ui.components.ErrorBox
import com.smartcampus.mobile.core.ui.components.LoadingBox

@Composable
fun RoomDetailScreen(
    viewModel: RoomDetailViewModel,
    onBack: () -> Unit,
    onNavigate: (String) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.navigateTo) {
        state.navigateTo?.let { destination ->
            onNavigate(destination)
            viewModel.consumeNavigation()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        OutlinedButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
            Text("Retour")
        }

        when {
            state.loading -> LoadingBox("Chargement de la salle…")

            state.error != null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.room != null -> state.room?.let { room ->
                Text(room.name, style = MaterialTheme.typography.titleLarge)
                Text("Bâtiment : ${room.buildingId}")
                Text("Capacité : ${room.capacity}")
                Text("Type : ${room.type.ifBlank { "Non précisé" }}")
                Text("Statut : ${room.status}")

                val availabilityText = when (state.available) {
                    true -> "Disponible pour le prochain créneau"
                    false -> "Indisponible pour le prochain créneau"
                    null -> "Disponibilité inconnue"
                }
                Text(availabilityText)

                Button(
                    onClick = viewModel::reserve,
                    enabled = state.available == true,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Réserver cette salle")
                }

                Spacer(Modifier.height(4.dp))
            }
        }
    }
}
