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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun LoginScreen(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Smart Campus",
            style = MaterialTheme.typography.titleLarge
        )

        Spacer(Modifier.height(24.dp))

        OutlinedTextField(
            value = state.email,
            onValueChange = viewModel::onEmailChange,
            label = { Text("Email") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(Modifier.height(12.dp))

        OutlinedTextField(
            value = state.password,
            onValueChange = viewModel::onPasswordChange,
            label = { Text("Mot de passe") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        if (state.error != null) {
            Spacer(Modifier.height(12.dp))
            Text(
                text = state.error ?: "",
                color = MaterialTheme.colorScheme.error
            )
        }

        Spacer(Modifier.height(20.dp))

        Button(
            onClick = viewModel::login,
            enabled = !state.loading,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (state.loading) "Connexion…" else "Se connecter")
        }

        Spacer(Modifier.height(24.dp))

        Text(
            text = "Compte démo : ahmed.wardi@campus.tn / student123. Un code TOTP est ensuite demandé.",
            style = MaterialTheme.typography.bodyMedium
        )
    }
}
