package com.smartcampus.mobile.feature.cafeteria

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
fun CafeteriaScreen(
    viewModel: CafeteriaViewModel,
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
        Text("Cafétéria", style = MaterialTheme.typography.titleLarge)

        Spacer(Modifier.height(12.dp))

        Button(
            onClick = viewModel::retry,
            enabled = !state.loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.loading) "Actualisation…" else "Rafraîchir")
        }

        state.menu?.let { menu ->
            Spacer(Modifier.height(12.dp))
            Text("Menu du jour : ${menu.meal}", style = MaterialTheme.typography.titleMedium)
            Text("Bâtiment : ${menu.building.ifBlank { "Non précisé" }}")
            Text("Horaires : ${menu.openingHours.ifBlank { "Non précisés" }}")
        }

        if (state.message != null) {
            Spacer(Modifier.height(8.dp))
            Text(state.message ?: "")
        }

        Spacer(Modifier.height(16.dp))

        when {
            state.loading -> LoadingBox("Chargement du menu…")

            state.error != null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.items.isEmpty() -> EmptyBox("Aucun plat disponible aujourd’hui.")

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(state.items, key = { it.id }) { item ->
                    Column(
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(item.name, style = MaterialTheme.typography.titleLarge)
                        Text("Prix : ${item.price} €")
                        if (item.description.isNotBlank()) {
                            Text(item.description)
                        }
                        if (item.dietaryLabelsCsv.isNotBlank()) {
                            Text("Régime : ${item.dietaryLabelsCsv}")
                        }
                        if (item.allergensCsv.isNotBlank()) {
                            Text("Allergènes : ${item.allergensCsv}")
                        }
                        OutlinedButton(
                            onClick = { viewModel.reserve(item.id) },
                            enabled = !state.loading,
                            modifier = Modifier.align(Alignment.Start),
                        ) {
                            Text("Commander")
                        }
                    }
                }
            }
        }
    }
}
