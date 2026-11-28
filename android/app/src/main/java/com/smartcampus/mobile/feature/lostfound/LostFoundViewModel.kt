package com.smartcampus.mobile.feature.lostfound

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LostFoundViewModel(
    private val repository: SmartCampusRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(LostFoundUiState())
    val state: StateFlow<LostFoundUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun retry() {
        load()
    }

    fun onQueryChange(value: String) {
        _state.value = _state.value.copy(query = value)
    }

    fun setStatus(status: String?) {
        _state.value = _state.value.copy(status = status)
        load()
    }

    fun applyFilters() {
        load()
    }

    fun openForm() {
        _state.value = _state.value.copy(navigateTo = "lost_found_form")
    }

    fun openDetail(id: String) {
        _state.value = _state.value.copy(navigateTo = "lost_found_detail/$id")
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val current = _state.value
                val items = repository.lostFound(
                    status = current.status,
                    query = current.query.takeIf { it.isNotBlank() },
                ).map { it.toUi() }
                _state.value = _state.value.copy(loading = false, items = items)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger les annonces",
                )
            }
        }
    }
}
