package com.smartcampus.mobile.feature.profile

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartcampus.mobile.core.ui.components.LoadingBox

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val requestNotifications = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> viewModel.setNotificationsEnabled(granted) }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Profil et préférences", style = MaterialTheme.typography.titleLarge)

        if (state.loading) {
            LoadingBox("Chargement du profil…")
        } else {
            Text(state.name.ifBlank { "Utilisateur" }, style = MaterialTheme.typography.titleMedium)
            Text(state.email)
            Text("Rôle : ${state.role}")

            Spacer(Modifier.height(8.dp))

            Text("Thème", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { viewModel.setTheme("SYSTEM") }) { Text("Système") }
                OutlinedButton(onClick = { viewModel.setTheme("LIGHT") }) { Text("Clair") }
                OutlinedButton(onClick = { viewModel.setTheme("DARK") }) { Text("Sombre") }
            }
            Text("Sélection : ${state.theme}")

            Spacer(Modifier.height(8.dp))

            Text("Langue", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { viewModel.setLanguage("FR") }) { Text("Français") }
                OutlinedButton(onClick = { viewModel.setLanguage("EN") }) { Text("English") }
            }
            Text("Langue enregistrée : ${state.language} (textes encore en français)")

            Spacer(Modifier.height(8.dp))

            OutlinedButton(
                onClick = {
                    if (state.notificationsEnabled) {
                        viewModel.setNotificationsEnabled(false)
                    } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                        ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.POST_NOTIFICATIONS
                        ) == PackageManager.PERMISSION_GRANTED
                    ) {
                        viewModel.setNotificationsEnabled(true)
                    } else {
                        requestNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    if (state.notificationsEnabled) {
                        "Notifications locales : activées"
                    } else {
                        "Notifications locales : désactivées"
                    }
                )
            }

            Spacer(Modifier.height(8.dp))

            Button(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
                Text("Retour")
            }
        }
    }
}
