package com.smartcampus.mobile.feature.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class NotificationsViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(NotificationsUiState(loading = true))
    val state: StateFlow<NotificationsUiState> = _state.asStateFlow()

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

    fun markRead(id: String) {
        viewModelScope.launch {
            try {
                repository.markNotificationRead(id)
                load()
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "Action impossible",
                )
            }
        }
    }

    fun markAllRead() {
        if (userId.isBlank()) return
        viewModelScope.launch {
            try {
                repository.readAllNotifications(userId)
                _state.value = _state.value.copy(message = "Tout est marqué comme lu")
                load()
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "Action impossible",
                )
            }
        }
    }

    fun delete(id: String) {
        viewModelScope.launch {
            try {
                repository.deleteNotification(id)
                _state.value = _state.value.copy(message = "Notification supprimée")
                load()
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "Suppression impossible",
                )
            }
        }
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val items = repository.notifications(userId).map { it.toUi() }
                val count = repository.unreadCount(userId)
                _state.value = _state.value.copy(
                    loading = false,
                    items = items,
                    unreadCount = count,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger les notifications",
                )
            }
        }
    }
}
