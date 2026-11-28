package com.smartcampus.mobile.feature.lostfound

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LostFoundDetailViewModel(
    private val repository: SmartCampusRepository,
    private val id: String,
) : ViewModel() {

    private val _state = MutableStateFlow(LostFoundDetailUiState())
    val state: StateFlow<LostFoundDetailUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun retry() {
        load()
    }

    fun claim() {
        viewModelScope.launch {
            try {
                repository.claimLostFound(id)
                _state.value = _state.value.copy(message = "Annonce marquée comme réclamée", error = null)
                load()
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message ?: "Action impossible")
            }
        }
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                _state.value = _state.value.copy(
                    loading = false,
                    item = repository.lostFoundItem(id).toUi(),
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger l’annonce",
                )
            }
        }
    }
}
