package com.smartcampus.mobile.feature.lostfound

import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartcampus.mobile.core.ui.components.EmptyBox
import com.smartcampus.mobile.core.ui.components.ErrorBox
import com.smartcampus.mobile.core.ui.components.LoadingBox

@Composable
fun LostFoundScreen(
    viewModel: LostFoundViewModel,
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
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Objets perdus et trouvés", style = MaterialTheme.typography.titleLarge)

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = { viewModel.setStatus(null) }) { Text("Tous") }
            OutlinedButton(onClick = { viewModel.setStatus("LOST") }) { Text("Perdus") }
            OutlinedButton(onClick = { viewModel.setStatus("FOUND") }) { Text("Trouvés") }
        }

        OutlinedTextField(
            value = state.query,
            onValueChange = viewModel::onQueryChange,
            label = { Text("Rechercher un objet") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Button(onClick = viewModel::applyFilters, modifier = Modifier.fillMaxWidth()) {
            Text("Appliquer le filtre")
        }

        Button(onClick = viewModel::openForm, modifier = Modifier.fillMaxWidth()) {
            Text("Publier une annonce")
        }

        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        when {
            state.loading -> LoadingBox("Chargement des annonces…")

            state.error != null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.items.isEmpty() -> EmptyBox("Aucune annonce pour ce filtre.")

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(state.items, key = { it.id }) { item ->
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(item.title, style = MaterialTheme.typography.titleMedium)
                        Text("${item.status} — ${item.location.ifBlank { "Lieu non précisé" }}")
                        if (item.photoData != null) {
                            Text("Photo jointe")
                        }
                        OutlinedButton(onClick = { viewModel.openDetail(item.id) }) {
                            Text("Voir le détail")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LostFoundFormScreen(
    viewModel: LostFoundFormViewModel,
    onBack: () -> Unit,
    onNavigate: (String) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    val takePicture = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        viewModel.onCameraResult(ok)
    }
    val pickImage = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        viewModel.onPhotoPicked(uri)
    }

    LaunchedEffect(state.cameraUri) {
        state.cameraUri?.let { uri ->
            takePicture.launch(Uri.parse(uri))
        }
    }

    LaunchedEffect(state.navigateTo) {
        state.navigateTo?.let { destination ->
            onNavigate(destination)
            viewModel.consumeNavigation()
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Publier une annonce", style = MaterialTheme.typography.titleLarge)

        OutlinedTextField(
            value = state.title,
            onValueChange = viewModel::onTitleChange,
            label = { Text("Titre de l’objet") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = { viewModel.onStatusChange("LOST") }) { Text("Perdu") }
            OutlinedButton(onClick = { viewModel.onStatusChange("FOUND") }) { Text("Trouvé") }
        }
        Text("Statut sélectionné : ${state.status}")

        OutlinedTextField(
            value = state.description,
            onValueChange = viewModel::onDescriptionChange,
            label = { Text("Description") },
            modifier = Modifier.fillMaxWidth(),
        )

        OutlinedTextField(
            value = state.location,
            onValueChange = viewModel::onLocationChange,
            label = { Text("Lieu") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        OutlinedTextField(
            value = state.category,
            onValueChange = viewModel::onCategoryChange,
            label = { Text("Catégorie") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        OutlinedTextField(
            value = state.contactPhone,
            onValueChange = viewModel::onContactChange,
            label = { Text("Téléphone de contact") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Text("Photo de l’objet", style = MaterialTheme.typography.titleMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = viewModel::prepareCameraPhoto) {
                Text("Appareil photo")
            }
            Button(onClick = { pickImage.launch("image/*") }) {
                Text("Galerie")
            }
        }

        state.photoData?.let { photo ->
            PhotoPreview(photo)
            OutlinedButton(onClick = viewModel::removePhoto) {
                Text("Retirer la photo")
            }
        }

        state.message?.let { Text(it) }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        Button(
            onClick = viewModel::publish,
            enabled = !state.loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.loading) "Publication…" else "Publier l’annonce")
        }

        OutlinedButton(
            onClick = {
                viewModel.consumeCameraUri()
                onBack()
            },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Retour")
        }
    }
}

@Composable
fun LostFoundDetailScreen(
    viewModel: LostFoundDetailViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Détail de l’annonce", style = MaterialTheme.typography.titleLarge)

        when {
            state.loading -> LoadingBox("Chargement de l’annonce…")

            state.error != null -> ErrorBox(
                message = state.error ?: "Erreur",
                onRetry = viewModel::retry,
            )

            state.item == null -> EmptyBox("Annonce introuvable.")

            else -> state.item?.let { item ->
                Text(item.title, style = MaterialTheme.typography.titleMedium)
                Text("Statut : ${item.status}")
                if (item.description.isNotBlank()) Text(item.description)
                if (item.location.isNotBlank()) Text("Lieu : ${item.location}")
                if (item.category.isNotBlank()) Text("Catégorie : ${item.category}")
                if (item.contactPhone.isNotBlank()) Text("Contact : ${item.contactPhone}")
                Text("Réactions : ${item.reactions}")
                item.photoData?.let { PhotoPreview(it) }
                state.message?.let { Text(it) }

                if (item.status != "CLAIMED") {
                    Button(onClick = viewModel::claim, modifier = Modifier.fillMaxWidth()) {
                        Text("Marquer comme réclamé")
                    }
                }
            }
        }

        Spacer(Modifier.height(8.dp))

        OutlinedButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
            Text("Retour")
        }
    }
}

/** Décode la photo base64 renvoyée par le backend pour l’afficher. */
@Composable
private fun PhotoPreview(base64: String) {
    val bitmap = remember(base64) {
        try {
            val bytes = Base64.decode(base64, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        } catch (e: IllegalArgumentException) {
            null
        }
    }
    if (bitmap != null) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = "Photo de l’objet",
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxWidth().height(180.dp),
        )
    }
}
