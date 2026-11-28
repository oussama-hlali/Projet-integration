package com.smartcampus.mobile.feature.rooms

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class RoomsViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(RoomsUiState(loading = true))
    val state: StateFlow<RoomsUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val savedFilter = prefs.roomsFilter()
            _state.value = _state.value.copy(query = savedFilter)
            loadRooms(savedFilter)
        }
    }

    fun onQueryChange(value: String) {
        _state.value = _state.value.copy(query = value)
        viewModelScope.launch {
            prefs.saveRoomsFilter(value)
        }
    }

    fun search() {
        loadRooms(_state.value.query)
    }

    fun retry() {
        loadRooms(_state.value.query)
    }

    fun openRoom(id: String) {
        _state.value = _state.value.copy(navigateTo = "room_detail/$id")
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun loadRooms(query: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val filter = query.trim().takeIf { it.isNotEmpty() }
                val rooms = repository.rooms(filter).map { it.toUi() }
                _state.value = _state.value.copy(loading = false, items = rooms)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger les salles",
                )
            }
        }
    }
}
