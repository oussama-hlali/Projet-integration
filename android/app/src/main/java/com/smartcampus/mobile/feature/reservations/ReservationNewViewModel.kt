package com.smartcampus.mobile.feature.reservations

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.temporal.ChronoUnit

class ReservationNewViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
    private val roomId: String,
) : ViewModel() {

    private val _state = MutableStateFlow(ReservationNewUiState(loading = true))
    val state: StateFlow<ReservationNewUiState> = _state.asStateFlow()

    private var userId: String = ""

    init {
        viewModelScope.launch {
            try {
                userId = prefs.userId().orEmpty()
                if (userId.isBlank()) {
                    throw Exception("Session introuvable")
                }
                val room = repository.room(roomId)
                _state.value = _state.value.copy(roomName = room.name)
                selectSlot(ReservationSlot.SOON)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de préparer la réservation",
                )
            }
        }
    }

    fun selectSlot(slot: ReservationSlot) {
        val (start, end) = slotTimes(slot)
        _state.value = _state.value.copy(
            slot = slot,
            startTime = start,
            endTime = end,
            available = null,
            error = null,
            loading = false,
        )

        viewModelScope.launch {
            try {
                val result = repository.availability(roomId, start, end)
                _state.value = _state.value.copy(available = result.available)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "Disponibilité indisponible",
                )
            }
        }
    }

    fun onPurposeChange(value: String) {
        _state.value = _state.value.copy(purpose = value, error = null)
    }

    fun submit() {
        val current = _state.value

        if (current.available != true) {
            _state.value = current.copy(error = "Choisissez un créneau disponible")
            return
        }

        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                repository.createReservation(
                    mapOf(
                        "roomId" to roomId,
                        "userId" to userId,
                        "startTime" to current.startTime,
                        "endTime" to current.endTime,
                        "purpose" to current.purpose.trim(),
                    )
                )
                _state.value = _state.value.copy(
                    loading = false,
                    message = "Réservation créée",
                    navigateTo = "reservations",
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Réservation impossible",
                )
            }
        }
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun slotTimes(slot: ReservationSlot): Pair<String, String> {
        val start = Instant.now().plus(slot.startOffsetHours, ChronoUnit.HOURS)
        val end = start.plus(slot.durationHours, ChronoUnit.HOURS)
        return start.toString() to end.toString()
    }
}
