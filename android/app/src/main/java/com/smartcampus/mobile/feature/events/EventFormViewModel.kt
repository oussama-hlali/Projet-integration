package com.smartcampus.mobile.feature.events

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.temporal.ChronoUnit

class EventFormViewModel(
    private val repository: SmartCampusRepository,
    private val eventId: String,
) : ViewModel() {

    private val _state = MutableStateFlow(EventFormUiState())
    val state: StateFlow<EventFormUiState> = _state.asStateFlow()

    init {
        val editing = eventId != "new"
        _state.value = _state.value.copy(
            eventId = eventId,
            isEdit = editing,
            date = Instant.now().plus(1, ChronoUnit.DAYS).toString(),
        )
        if (editing) {
            load()
        }
    }

    fun onTitleChange(value: String) = update { copy(title = value, error = null) }

    fun onDescriptionChange(value: String) = update { copy(description = value, error = null) }

    fun onCategoryChange(value: String) = update { copy(category = value, error = null) }

    fun onLocationChange(value: String) = update { copy(location = value, error = null) }

    fun onCapacityChange(value: String) = update { copy(capacity = value, error = null) }

    fun onDateChange(value: String) = update { copy(date = value, error = null) }

    fun onEndDateChange(value: String) = update { copy(endDate = value, error = null) }

    fun onRoomIdChange(value: String) = update { copy(roomId = value, error = null) }

    fun save() {
        val current = _state.value
        val capacity = current.capacity.trim().toIntOrNull()
        if (current.title.isBlank()) {
            _state.value = current.copy(error = "Le titre est obligatoire")
            return
        }
        if (capacity == null || capacity < 0) {
            _state.value = current.copy(error = "La capacité doit être un nombre positif")
            return
        }
        if (current.date.isBlank()) {
            _state.value = current.copy(error = "La date est obligatoire")
            return
        }

        val body = mutableMapOf<String, Any>(
            "title" to current.title.trim(),
            "description" to current.description.trim(),
            "category" to current.category.trim(),
            "location" to current.location.trim(),
            "capacity" to capacity,
            "date" to current.date.trim(),
        )
        if (current.endDate.isNotBlank()) {
            body["endDate"] = current.endDate.trim()
        }
        if (current.roomId.isNotBlank()) {
            body["roomId"] = current.roomId.trim()
        }

        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                if (current.isEdit) {
                    repository.updateEvent(current.eventId, body)
                } else {
                    repository.createEvent(body)
                }
                _state.value = _state.value.copy(
                    loading = false,
                    message = if (current.isEdit) "Événement modifié" else "Événement créé",
                    navigateTo = "events",
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

    private fun update(block: EventFormUiState.() -> EventFormUiState) {
        _state.value = _state.value.block()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val event = repository.event(eventId)
                _state.value = _state.value.copy(
                    loading = false,
                    title = event.title,
                    description = event.description.orEmpty(),
                    category = event.category,
                    location = event.location.orEmpty(),
                    capacity = event.capacity.toString(),
                    date = event.date,
                    endDate = event.endDate.orEmpty(),
                    roomId = event.roomId.orEmpty(),
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
