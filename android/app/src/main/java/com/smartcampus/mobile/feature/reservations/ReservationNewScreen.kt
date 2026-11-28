package com.smartcampus.mobile.feature.reservations

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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun ReservationNewScreen(
    viewModel: ReservationNewViewModel,
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

        Text("Nouvelle réservation", style = MaterialTheme.typography.titleLarge)
        Text("Salle : ${state.roomName.ifBlank { "…" }}")

        Text("Créneau", style = MaterialTheme.typography.bodyMedium)
        ReservationSlot.entries.forEach { slot ->
            OutlinedButton(
                onClick = { viewModel.selectSlot(slot) },
                enabled = !state.loading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    text = slot.label,
                    color = if (slot == state.slot) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.onSurface,
                )
            }
        }

        Text("Début : ${state.startTime.ifBlank { "…" }}")
        Text("Fin : ${state.endTime.ifBlank { "…" }}")

        val availabilityText = when (state.available) {
            true -> "Créneau disponible"
            false -> "Créneau indisponible"
            null -> "Vérification du créneau…"
        }
        Text(availabilityText)

        OutlinedTextField(
            value = state.purpose,
            onValueChange = viewModel::onPurposeChange,
            label = { Text("Motif (facultatif)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        if (state.error != null) {
            Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
        }

        if (state.message != null) {
            Text(state.message ?: "")
        }

        Button(
            onClick = viewModel::submit,
            enabled = !state.loading && state.available == true,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.loading) "Envoi…" else "Réserver")
        }

        Spacer(Modifier.height(4.dp))
    }
}
