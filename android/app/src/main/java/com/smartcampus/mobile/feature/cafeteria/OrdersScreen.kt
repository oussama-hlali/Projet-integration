package com.smartcampus.mobile.feature.cafeteria

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartcampus.mobile.core.ui.components.EmptyBox
import com.smartcampus.mobile.core.ui.components.ErrorBox
import com.smartcampus.mobile.core.ui.components.LoadingBox

@Composable
fun OrdersScreen(viewModel: OrdersViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("Mes commandes", style = MaterialTheme.typography.titleLarge)

        Spacer(Modifier.height(12.dp))

        Button(
            onClick = viewModel::retry,
            enabled = !state.loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.loading) "Actualisation…" else "Rafraîchir")
        }

        if (state.message != null) {
            Spacer(Modifier.height(8.dp))
            Text(state.message ?: "")
        }

        Spacer(Modifier.height(16.dp))

        when {
            state.loading -> LoadingBox("Chargement des commandes…")

            state.error != null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.items.isEmpty() -> EmptyBox("Aucune commande active.")

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(state.items, key = { it.id }) { order ->
                    Column(
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(order.itemName, style = MaterialTheme.typography.titleLarge)
                        Text("Référence : ${order.reference}")
                        Text("Menu : ${order.menuLabel.ifBlank { "Non précisé" }}")
                        Text("Prix : ${order.price} €")
                        Text("Statut : ${order.status}")
                        if (order.pickupTime.isNotBlank()) {
                            Text("Retrait : ${order.pickupTime}")
                        }
                        Text("QR : ${order.qrPayload}")

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(onClick = { viewModel.cancel(order.id) }) {
                                Text("Annuler")
                            }
                        }
                    }
                }
            }
        }
    }
}
