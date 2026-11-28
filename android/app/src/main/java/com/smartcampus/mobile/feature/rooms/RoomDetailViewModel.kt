package com.smartcampus.mobile.feature.rooms

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.temporal.ChronoUnit

class RoomDetailViewModel(
    private val repository: SmartCampusRepository,
    private val roomId: String,
) : ViewModel() {

    private val _state = MutableStateFlow(RoomDetailUiState(loading = true))
    val state: StateFlow<RoomDetailUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun retry() {
        load()
    }

    fun reserve() {
        _state.value = _state.value.copy(navigateTo = "reservation_new/$roomId")
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val room = repository.room(roomId).toUi()
                val start = Instant.now().plus(1, ChronoUnit.HOURS)
                val from = start.toString()
                val to = start.plus(1, ChronoUnit.HOURS).toString()
                val available = repository.availability(roomId, from, to).available

                _state.value = _state.value.copy(
                    loading = false,
                    room = room,
                    available = available,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger cette salle",
                )
            }
        }
    }
}
