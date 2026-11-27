package com.smartcampus.mobile.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun MfaVerifyScreen(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var code by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("Vérification TOTP", style = MaterialTheme.typography.titleLarge)

        Spacer(Modifier.height(16.dp))

        if (state.setupRequired && state.setupSecret.isNotBlank()) {
            Text("Secret configuré : ${state.setupSecret}")
            Spacer(Modifier.height(12.dp))
        }

        OutlinedTextField(
            value = code,
            onValueChange = { code = it },
            label = { Text("Code à 6 chiffres") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        if (state.error != null) {
            Spacer(Modifier.height(12.dp))
            Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
        }

        Spacer(Modifier.height(20.dp))

        Button(
            onClick = { viewModel.verify(code) },
            enabled = !state.loading && code.length >= 6,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (state.loading) "Vérification…" else "Vérifier")
        }
    }
}
