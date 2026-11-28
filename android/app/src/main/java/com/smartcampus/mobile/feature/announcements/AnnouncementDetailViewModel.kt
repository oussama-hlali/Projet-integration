package com.smartcampus.mobile.feature.announcements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AnnouncementDetailViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
    private val announcementId: String,
) : ViewModel() {

    private val _state = MutableStateFlow(AnnouncementDetailUiState(loading = true))
    val state: StateFlow<AnnouncementDetailUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val admin = prefs.role().equals("ADMINISTRATOR", ignoreCase = true)
            _state.value = _state.value.copy(isAdmin = admin)
            load()
        }
    }

    fun retry() {
        load()
    }

    fun onConfirmChange(value: String) {
        _state.value = _state.value.copy(confirmText = value, error = null)
    }

    fun edit() {
        _state.value = _state.value.copy(navigateTo = "announcement_form/$announcementId")
    }

    fun delete() {
        val title = _state.value.item?.title.orEmpty()
        if (_state.value.confirmText.trim() != "delete $title") {
            _state.value = _state.value.copy(error = "Tapez « delete $title » pour confirmer")
            return
        }

        viewModelScope.launch {
            try {
                repository.deleteAnnouncement(announcementId)
                _state.value = _state.value.copy(
                    message = "Annonce supprimée",
                    navigateTo = "announcements",
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message ?: "Suppression impossible")
            }
        }
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val item = repository.announcement(announcementId).toUi()
                _state.value = _state.value.copy(loading = false, item = item)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger l’annonce",
                )
            }
        }
    }
}
