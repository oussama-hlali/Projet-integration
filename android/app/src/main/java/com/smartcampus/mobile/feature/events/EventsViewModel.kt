package com.smartcampus.mobile.feature.events

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class EventsViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(EventsUiState(loading = true))
    val state: StateFlow<EventsUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val admin = prefs.role().equals("ADMINISTRATOR", ignoreCase = true)
            _state.value = _state.value.copy(isAdmin = admin)
            loadEvents()
        }
    }

    fun onCategoryChange(value: String) {
        _state.value = _state.value.copy(category = value)
    }

    fun search() {
        loadEvents()
    }

    fun retry() {
        loadEvents()
    }

    fun openDetail(id: String) {
        _state.value = _state.value.copy(navigateTo = "event_detail/$id")
    }

    fun openCreate() {
        _state.value = _state.value.copy(navigateTo = "event_form/new")
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun loadEvents() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val category = _state.value.category.trim().takeIf { it.isNotEmpty() }
                val items = repository.events(category).map { it.toUi() }
                _state.value = _state.value.copy(loading = false, items = items)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger les événements",
                )
            }
        }
    }
}
