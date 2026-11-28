package com.smartcampus.mobile.feature.rooms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartcampus.mobile.core.ui.components.EmptyBox
import com.smartcampus.mobile.core.ui.components.ErrorBox
import com.smartcampus.mobile.core.ui.components.LoadingBox

@Composable
fun RoomsScreen(
    viewModel: RoomsViewModel,
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
            .padding(16.dp)
    ) {
        Text("Salles", style = MaterialTheme.typography.titleLarge)

        Spacer(Modifier.height(12.dp))

        OutlinedTextField(
            value = state.query,
            onValueChange = viewModel::onQueryChange,
            label = { Text("Rechercher une salle") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(Modifier.height(8.dp))

        Button(
            onClick = viewModel::search,
            enabled = !state.loading,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (state.loading) "Recherche…" else "Rechercher")
        }

        Spacer(Modifier.height(16.dp))

        when {
            state.loading -> LoadingBox("Chargement des salles…")

            state.error != null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.items.isEmpty() -> EmptyBox("Aucune salle trouvée.")

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(state.items, key = { it.id }) { room ->
                    OutlinedButton(
                        onClick = { viewModel.openRoom(room.id) },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(
                            horizontalAlignment = Alignment.Start,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(room.name, style = MaterialTheme.typography.titleLarge)
                            Text("Bâtiment : ${room.buildingId}")
                            Text("Capacité : ${room.capacity} — ${room.status}")
                            if (room.type.isNotBlank()) {
                                Text("Type : ${room.type}")
                            }
                        }
                    }
                }
            }
        }
    }
}
