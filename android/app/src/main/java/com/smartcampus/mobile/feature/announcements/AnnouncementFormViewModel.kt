package com.smartcampus.mobile.feature.announcements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AnnouncementFormViewModel(
    private val repository: SmartCampusRepository,
    private val announcementId: String,
) : ViewModel() {

    private val _state = MutableStateFlow(AnnouncementFormUiState())
    val state: StateFlow<AnnouncementFormUiState> = _state.asStateFlow()

    init {
        val editing = announcementId != "new"
        _state.value = _state.value.copy(
            announcementId = announcementId,
            isEdit = editing,
        )
        if (editing) {
            load()
        }
    }

    fun onTitleChange(value: String) = update { copy(title = value, error = null) }

    fun onBodyChange(value: String) = update { copy(body = value, error = null) }

    fun onCategoryChange(value: String) = update { copy(category = value, error = null) }

    fun togglePinned() = update { copy(pinned = !pinned, error = null) }

    fun save() {
        val current = _state.value
        if (current.title.isBlank()) {
            _state.value = current.copy(error = "Le titre est obligatoire")
            return
        }
        if (current.body.isBlank()) {
            _state.value = current.copy(error = "Le contenu est obligatoire")
            return
        }

        val body = mapOf<String, Any>(
            "title" to current.title.trim(),
            "body" to current.body.trim(),
            "category" to current.category.trim(),
            "pinned" to current.pinned,
        )

        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                if (current.isEdit) {
                    repository.updateAnnouncement(current.announcementId, body)
                } else {
                    repository.createAnnouncement(body)
                }
                _state.value = _state.value.copy(
                    loading = false,
                    message = if (current.isEdit) "Annonce modifiée" else "Annonce créée",
                    navigateTo = "announcements",
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Enregistrement impossible",
                )
            }
        }
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun update(block: AnnouncementFormUiState.() -> AnnouncementFormUiState) {
        _state.value = _state.value.block()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val announcement = repository.announcement(announcementId)
                _state.value = _state.value.copy(
                    loading = false,
                    title = announcement.title,
                    body = announcement.body,
                    category = announcement.category,
                    pinned = announcement.pinned,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger l’annonce",
                )
            }
        }
    }
}
