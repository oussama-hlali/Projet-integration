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
fun ReservationDetailScreen(
    viewModel: ReservationDetailViewModel,
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
            state.loading -> LoadingBox("Chargement de la réservation…")

            state.error != null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.item != null -> state.item?.let { item ->
                Text(item.roomName, style = MaterialTheme.typography.titleLarge)
                Text("Du ${item.startTime} au ${item.endTime}")
                Text("Motif : ${item.purpose}")
                Text("Statut : ${item.status}")

                if (state.message != null) {
                    Text(state.message ?: "")
                }

                Button(
                    onClick = viewModel::cancel,
                    enabled = !item.status.equals("CANCELLED", ignoreCase = true),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Annuler la réservation")
                }

                Spacer(Modifier.height(4.dp))
            }
        }
    }
}
