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

@Composable
fun AnnouncementFormScreen(
    viewModel: AnnouncementFormViewModel,
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
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        OutlinedButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
            Text("Retour")
        }

        Text(
            text = if (state.isEdit) "Modifier l’annonce" else "Nouvelle annonce",
            style = MaterialTheme.typography.titleLarge,
        )

        OutlinedTextField(
            value = state.title,
            onValueChange = viewModel::onTitleChange,
            label = { Text("Titre") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        OutlinedTextField(
            value = state.body,
            onValueChange = viewModel::onBodyChange,
            label = { Text("Contenu") },
            modifier = Modifier.fillMaxWidth(),
        )

        OutlinedTextField(
            value = state.category,
            onValueChange = viewModel::onCategoryChange,
            label = { Text("Catégorie") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        val pinnedLabel = if (state.pinned) "oui" else "non"
        OutlinedButton(
            onClick = viewModel::togglePinned,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Épinglée : $pinnedLabel")
        }

        if (state.error != null) {
            Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
        }
        if (state.message != null) {
            Text(state.message ?: "")
        }

        Button(
            onClick = viewModel::save,
            enabled = !state.loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.loading) "Enregistrement…" else "Enregistrer")
        }
    }
}
