package com.smartcampus.mobile.feature.reservations

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ReservationsViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(ReservationsUiState(loading = true))
    val state: StateFlow<ReservationsUiState> = _state.asStateFlow()

    private var userId: String = ""

    init {
        viewModelScope.launch {
            userId = prefs.userId().orEmpty()
            if (userId.isBlank()) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = "Session introuvable",
                )
            } else {
                loadReservations()
            }
        }
    }

    fun retry() {
        loadReservations()
    }

    fun cancel(id: String) {
        viewModelScope.launch {
            try {
                repository.cancelReservation(id)
                _state.value = _state.value.copy(
                    message = "Réservation annulée",
                    error = null,
                )
                loadReservations()
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "Annulation impossible",
                )
            }
        }
    }

    fun openDetail(id: String) {
        _state.value = _state.value.copy(navigateTo = "reservation_detail/$id")
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun loadReservations() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val active = repository.reservations(userId)
                    .filterNot { it.status.equals("CANCELLED", ignoreCase = true) }
                    .map { it.toUi() }
                _state.value = _state.value.copy(loading = false, items = active)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger les réservations",
                )
            }
        }
    }
}
