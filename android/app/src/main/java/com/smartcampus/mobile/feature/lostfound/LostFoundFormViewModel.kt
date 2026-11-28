package com.smartcampus.mobile.feature.lostfound

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import com.smartcampus.mobile.core.util.PhotoEncoder
import com.smartcampus.mobile.core.util.PhotoFiles
import com.smartcampus.mobile.core.util.photoError
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LostFoundFormViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
    private val photoEncoder: PhotoEncoder,
    private val photoFiles: PhotoFiles,
) : ViewModel() {

    private val _state = MutableStateFlow(LostFoundFormUiState())
    val state: StateFlow<LostFoundFormUiState> = _state.asStateFlow()

    fun onTitleChange(value: String) {
        _state.value = _state.value.copy(title = value)
    }

    fun onDescriptionChange(value: String) {
        _state.value = _state.value.copy(description = value)
    }

    fun onLocationChange(value: String) {
        _state.value = _state.value.copy(location = value)
    }

    fun onCategoryChange(value: String) {
        _state.value = _state.value.copy(category = value)
    }

    fun onContactChange(value: String) {
        _state.value = _state.value.copy(contactPhone = value)
    }

    fun onStatusChange(value: String) {
        _state.value = _state.value.copy(status = value)
    }

    /** Prépare le fichier temporaire que l’écran donnera à l’appareil photo. */
    fun prepareCameraPhoto() {
        _state.value = _state.value.copy(cameraUri = photoFiles.newCameraUri().toString())
    }

    fun consumeCameraUri() {
        _state.value = _state.value.copy(cameraUri = null)
    }

    fun onCameraResult(success: Boolean) {
        val uri = _state.value.cameraUri
        consumeCameraUri()
        if (!success || uri == null) {
            _state.value = _state.value.copy(error = "Photo annulée")
            return
        }
        attachPhoto(Uri.parse(uri))
    }

    fun onPhotoPicked(uri: Uri?) {
        if (uri != null) attachPhoto(uri)
    }

    fun removePhoto() {
        _state.value = _state.value.copy(photoData = null, message = null, error = null)
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    fun publish() {
        viewModelScope.launch {
            val current = _state.value
            val userId = prefs.userId().orEmpty()
            val error = lostFoundInputError(
                title = current.title,
                reporterId = userId,
                status = current.status,
                photoData = current.photoData,
            )
            if (error != null) {
                _state.value = current.copy(error = error)
                return@launch
            }

            _state.value = current.copy(loading = true, error = null)
            try {
                val body = mutableMapOf<String, Any>(
                    "title" to current.title.trim(),
                    "status" to current.status,
                    "reporterId" to userId,
                )
                current.description.takeIf { it.isNotBlank() }?.let { body["description"] = it.trim() }
                current.location.takeIf { it.isNotBlank() }?.let { body["location"] = it.trim() }
                current.category.takeIf { it.isNotBlank() }?.let { body["category"] = it.trim() }
                current.contactPhone.takeIf { it.isNotBlank() }?.let { body["contactPhone"] = it.trim() }
                current.photoData?.let { body["photoData"] = it }

                repository.createLostFound(body)
                _state.value = _state.value.copy(
                    loading = false,
                    message = "Annonce publiée",
                    navigateTo = "lost_found",
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Publication impossible",
                )
            }
        }
    }

    private fun attachPhoto(uri: Uri) {
        viewModelScope.launch {
            val encoded = photoEncoder.encode(uri)
            val error = photoError(encoded)
            _state.value = if (error != null) {
                _state.value.copy(error = error)
            } else {
                _state.value.copy(
                    photoData = encoded,
                    error = null,
                    message = "Photo ajoutée",
                )
            }
        }
    }
}
