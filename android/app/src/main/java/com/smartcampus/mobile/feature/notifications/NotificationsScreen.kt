package com.smartcampus.mobile.feature.notifications

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
fun NotificationsScreen(viewModel: NotificationsViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("Notifications", style = MaterialTheme.typography.titleLarge)
        Text("Non lues : ${state.unreadCount}")

        Spacer(Modifier.height(12.dp))

        Button(
            onClick = viewModel::retry,
            enabled = !state.loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.loading) "Actualisation…" else "Rafraîchir")
        }

        Spacer(Modifier.height(8.dp))

        OutlinedButton(
            onClick = viewModel::markAllRead,
            enabled = !state.loading && state.unreadCount > 0,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Tout marquer comme lu")
        }

        if (state.message != null) {
            Spacer(Modifier.height(8.dp))
            Text(state.message ?: "")
        }

        Spacer(Modifier.height(16.dp))

        when {
            state.loading -> LoadingBox("Chargement des notifications…")

            state.error != null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.items.isEmpty() -> EmptyBox("Aucune notification.")

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(state.items, key = { it.id }) { notification ->
                    Column(
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(notification.message, style = MaterialTheme.typography.titleLarge)
                        Text("${notification.type} — ${notification.createdAt}")
                        Text(if (notification.read) "Lue" else "Non lue")

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (!notification.read) {
                                OutlinedButton(onClick = { viewModel.markRead(notification.id) }) {
                                    Text("Marquer comme lue")
                                }
                            }
                            OutlinedButton(onClick = { viewModel.delete(notification.id) }) {
                                Text("Supprimer")
                            }
                        }
                    }
                }
            }
        }
    }
}
