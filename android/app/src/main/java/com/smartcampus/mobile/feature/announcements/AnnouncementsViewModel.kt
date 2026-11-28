package com.smartcampus.mobile.feature.announcements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AnnouncementsViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(AnnouncementsUiState(loading = true))
    val state: StateFlow<AnnouncementsUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val admin = prefs.role().equals("ADMINISTRATOR", ignoreCase = true)
            _state.value = _state.value.copy(isAdmin = admin)
            loadAnnouncements()
        }
    }

    fun retry() {
        loadAnnouncements()
    }

    fun openDetail(id: String) {
        _state.value = _state.value.copy(navigateTo = "announcement_detail/$id")
    }

    fun openCreate() {
        _state.value = _state.value.copy(navigateTo = "announcement_form/new")
    }

    fun consumeNavigation() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun loadAnnouncements() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val items = repository.announcements()
                    .map { it.toUi() }
                    .sortedByDescending { it.pinned }
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
