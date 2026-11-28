package com.smartcampus.mobile.feature.announcements

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
fun AnnouncementDetailScreen(
    viewModel: AnnouncementDetailViewModel,
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
            state.loading -> LoadingBox("Chargement de l’annonce…")

            state.error != null && state.item == null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.item != null -> state.item?.let { announcement ->
                Text(announcement.title, style = MaterialTheme.typography.titleLarge)
                Text("${announcement.category} — ${announcement.createdAt}")
                if (announcement.pinned) {
                    Text("Annonce épinglée")
                }
                Text(announcement.body)

                if (state.isAdmin) {
                    OutlinedButton(
                        onClick = viewModel::edit,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Modifier l’annonce")
                    }

                    OutlinedTextField(
                        value = state.confirmText,
                        onValueChange = viewModel::onConfirmChange,
                        label = { Text("Tapez delete ${announcement.title}") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )

                    Button(
                        onClick = viewModel::delete,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Supprimer l’annonce")
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
