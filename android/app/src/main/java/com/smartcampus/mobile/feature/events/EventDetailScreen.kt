package com.smartcampus.mobile.feature.events

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import com.smartcampus.mobile.core.ui.components.ErrorBox
import com.smartcampus.mobile.core.ui.components.LoadingBox

@Composable
fun EventDetailScreen(
    viewModel: EventDetailViewModel,
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
            state.loading -> LoadingBox("Chargement de l’événement…")

            state.error != null && state.item == null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.item != null -> state.item?.let { event ->
                Text(event.title, style = MaterialTheme.typography.titleLarge)
                Text("${event.category} — ${event.date}")
                val location = event.location.ifBlank { "Non précisé" }
                Text("Lieu : $location")
                Text("Capacité : ${event.capacity}")
                if (event.description.isNotBlank()) {
                    Text(event.description)
                }

                OutlinedButton(
                    onClick = viewModel::toggleInterest,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (state.interested) "Retirer des intérêts" else "Ajouter aux intérêts")
                }

                if (state.registered) {
                    OutlinedButton(
                        onClick = viewModel::unregister,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Annuler mon inscription")
                    }
                    if (state.qrCode != null) {
                        Text("QR : ${state.qrCode}")
                    }
                } else {
                    Button(
                        onClick = viewModel::register,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("S’inscrire")
                    }
                }

                if (state.isAdmin) {
                    OutlinedButton(
                        onClick = viewModel::edit,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Modifier l’événement")
                    }

                    OutlinedTextField(
                        value = state.confirmText,
                        onValueChange = viewModel::onConfirmChange,
                        label = { Text("Tapez delete ${event.title}") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )

                    Button(
                        onClick = viewModel::delete,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Supprimer l’événement")
                    }
                }

                if (state.error != null) {
                    Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
                }
                if (state.message != null) {
                    Text(state.message ?: "")
                }
            }
        }
    }
}
