package com.smartcampus.mobile.feature.reservations

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ReservationDetailViewModel(
    private val repository: SmartCampusRepository,
    private val reservationId: String,
) : ViewModel() {

    private val _state = MutableStateFlow(ReservationDetailUiState(loading = true))
    val state: StateFlow<ReservationDetailUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun retry() {
        load()
    }

    fun cancel() {
        viewModelScope.launch {
            try {
                repository.cancelReservation(reservationId)
                _state.value = _state.value.copy(
                    message = "Réservation annulée",
                    navigateTo = "reservations",
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "Annulation impossible",
                )
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
                val item = repository.reservation(reservationId).toUi()
                _state.value = _state.value.copy(loading = false, item = item)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger la réservation",
                )
            }
        }
    }
}
