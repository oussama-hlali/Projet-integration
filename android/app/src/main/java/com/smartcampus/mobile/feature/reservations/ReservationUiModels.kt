package com.smartcampus.mobile.feature.reservations

import com.smartcampus.mobile.core.model.dto.ReservationDto

/** Créneaux simples et explicites, sans date picker compliqué. */
enum class ReservationSlot(
    val label: String,
    val startOffsetHours: Long,
    val durationHours: Long,
) {
    SOON("Dans 1 heure", 1, 1),
    TOMORROW("Demain", 24, 1),
}

private fun formatTime(value: String): String =
    if (value.length >= 16) value.take(16).replace("T", " ") else value

data class ReservationUiItem(
    val id: String,
    val roomName: String,
    val startTime: String,
    val endTime: String,
    val purpose: String,
    val status: String,
)

fun ReservationDto.toUi(): ReservationUiItem = ReservationUiItem(
    id = id,
    roomName = roomName?.takeIf { it.isNotBlank() } ?: "Salle $roomId",
    startTime = formatTime(startTime),
    endTime = formatTime(endTime),
    purpose = purpose?.takeIf { it.isNotBlank() } ?: "Aucun motif",
    status = status,
)

data class ReservationsUiState(
    val loading: Boolean = false,
    val items: List<ReservationUiItem> = emptyList(),
    val error: String? = null,
    val message: String? = null,
    val navigateTo: String? = null,
)

data class ReservationDetailUiState(
    val loading: Boolean = false,
    val item: ReservationUiItem? = null,
    val error: String? = null,
    val message: String? = null,
    val navigateTo: String? = null,
)

data class ReservationNewUiState(
    val roomName: String = "",
    val slot: ReservationSlot = ReservationSlot.SOON,
    val startTime: String = "",
    val endTime: String = "",
    val purpose: String = "",
    val available: Boolean? = null,
    val loading: Boolean = false,
    val error: String? = null,
    val message: String? = null,
    val navigateTo: String? = null,
)
