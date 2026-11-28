package com.smartcampus.mobile.feature.rooms

import com.smartcampus.mobile.core.model.dto.RoomDto

/** Modèle UI simple : le Composable n’affiche jamais directement le DTO Retrofit. */
data class RoomUiItem(
    val id: String,
    val name: String,
    val buildingId: String,
    val capacity: Int,
    val status: String,
    val type: String,
)

fun RoomDto.toUi(): RoomUiItem = RoomUiItem(
    id = id,
    name = name,
    buildingId = buildingId,
    capacity = capacity,
    status = status,
    type = type.orEmpty(),
)

data class RoomsUiState(
    val query: String = "",
    val loading: Boolean = false,
    val items: List<RoomUiItem> = emptyList(),
    val error: String? = null,
    val navigateTo: String? = null,
)

data class RoomDetailUiState(
    val loading: Boolean = false,
    val room: RoomUiItem? = null,
    val available: Boolean? = null,
    val error: String? = null,
    val navigateTo: String? = null,
)
