package com.smartcampus.mobile.feature.cafeteria

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class OrdersViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(OrdersUiState(loading = true))
    val state: StateFlow<OrdersUiState> = _state.asStateFlow()

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
                load()
            }
        }
    }

    fun retry() {
        if (userId.isBlank()) return
        load()
    }

    fun cancel(id: String) {
        if (userId.isBlank()) return
        viewModelScope.launch {
            try {
                val result = repository.cancelOrder(id, userId)
                _state.value = _state.value.copy(
                    message = if (result.cancelled) "Commande annulée" else "Annulation impossible",
                    error = null,
                )
                load()
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "Annulation impossible",
                )
            }
        }
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val active = repository.orders(userId)
                    .activeOnly()
                    .map { it.toUi() }
                _state.value = _state.value.copy(loading = false, items = active)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger les commandes",
                )
            }
        }
    }
}
