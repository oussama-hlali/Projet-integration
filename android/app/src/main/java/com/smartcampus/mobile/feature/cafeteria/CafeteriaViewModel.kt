package com.smartcampus.mobile.feature.cafeteria

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

class CafeteriaViewModel(
    private val repository: SmartCampusRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(CafeteriaUiState(loading = true))
    val state: StateFlow<CafeteriaUiState> = _state.asStateFlow()

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

    fun reserve(itemId: String) {
        val menu = _state.value.menu
        if (menu == null || userId.isBlank()) {
            _state.value = _state.value.copy(error = "Session ou menu introuvable")
            return
        }

        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val key = UUID.randomUUID().toString()
                repository.reserveOrder(
                    key,
                    mapOf(
                        "menuId" to menu.id,
                        "itemId" to itemId,
                        "userId" to userId,
                    )
                )
                _state.value = _state.value.copy(
                    loading = false,
                    message = "Commande confirmée",
                    navigateTo = "orders",
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Commande impossible",
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
                val menu = repository.todayMenu().toUi()
                val items = repository.menuItems(menu.id).map { it.toUi() }
                _state.value = _state.value.copy(
                    loading = false,
                    menu = menu,
                    items = items,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Impossible de charger le menu",
                )
            }
        }
    }
}
