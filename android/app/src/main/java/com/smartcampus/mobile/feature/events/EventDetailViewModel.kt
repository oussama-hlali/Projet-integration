package com.smartcampus.mobile.feature.events

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class EventDetailViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
    private val eventId: String,
) : ViewModel() {

    private val _state = MutableStateFlow(EventDetailUiState(loading = true))
    val state: StateFlow<EventDetailUiState> = _state.asStateFlow()

    private var userId: String = ""

    init {
        viewModelScope.launch {
            userId = prefs.userId().orEmpty()
            val isAdmin = prefs.role().equals("ADMINISTRATOR", ignoreCase = true)
            _state.value = _state.value.copy(isAdmin = isAdmin)
            load()
        }
    }

    fun retry() {
        load()
    }

    fun toggleInterest() {
        if (userId.isBlank()) return
        viewModelScope.launch {
            try {
                val result = repository.toggleInterest(eventId, userId)
                _state.value = _state.value.copy(
                    interested = result.interested,
                    message = if (result.interested) "Ajouté aux intérêts" else "Retiré des intérêts",
                    error = null,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message ?: "Action impossible")
            }
        }
    }

    fun register() {
        if (userId.isBlank()) return
        viewModelScope.launch {
            try {
                val result = repository.registerToEvent(eventId, userId)
                _state.value = _state.value.copy(
                    registered = true,
                    qrCode = result.qrCode,
                    message = "Inscription confirmée",
                    error = null,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message ?: "Inscription impossible")
            }
        }
    }

    fun unregister() {
        if (userId.isBlank()) return
        viewModelScope.launch {
            try {
                repository.unregisterFromEvent(eventId, userId)
                _state.value = _state.value.copy(
                    registered = false,
                    qrCode = null,
                    message = "Inscription annulée",
                    error = null,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message ?: "Annulation impossible")
            }
        }
    }

    fun onConfirmChange(value: String) {
        _state.value = _state.value.copy(confirmText = value, error = null)
    }

    fun edit() {
        _state.value = _state.value.copy(navigateTo = "event_form/$eventId")
    }

    fun delete() {
        val title = _state.value.item?.title.orEmpty()
        if (_state.value.confirmText.trim() != "delete $title") {
            _state.value = _state.value.copy(error = "Tapez « delete $title » pour confirmer")
            return
        }

        viewModelScope.launch {
            try {
                repository.deleteEvent(eventId)
                _state.value = _state.value.copy(
                    message = "Événement supprimé",
                    navigateTo = "events",
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
                val item = repository.event(eventId).toUi()
                val interested = if (userId.isBlank()) false
                else repository.interestStatus(eventId, userId).interested
                val registration = if (userId.isBlank()) null
                else repository.myRegistration(eventId, userId)

                _state.value = _state.value.copy(
                    loading = false,
                    item = item,
                    interested = interested,
                    registered = registration?.registered ?: false,
                    qrCode = registration?.qrCode,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger l’événement",
                )
            }
        }
    }
}
