package com.smartcampus.mobile.feature.events

import com.smartcampus.mobile.core.model.dto.EventDto
import com.smartcampus.mobile.core.ui.formatIsoTime

data class EventUiItem(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val date: String,
    val endDate: String,
    val location: String,
    val capacity: Int,
)

fun EventDto.toUi(): EventUiItem = EventUiItem(
    id = id,
    title = title,
    description = description.orEmpty(),
    category = category,
    date = formatIsoTime(date),
    endDate = endDate?.let { formatIsoTime(it) }.orEmpty(),
    location = location.orEmpty(),
    capacity = capacity,
)

data class EventsUiState(
    val category: String = "",
    val loading: Boolean = false,
    val items: List<EventUiItem> = emptyList(),
    val error: String? = null,
    val isAdmin: Boolean = false,
    val navigateTo: String? = null,
)

data class EventDetailUiState(
    val loading: Boolean = false,
    val item: EventUiItem? = null,
    val isAdmin: Boolean = false,
    val interested: Boolean = false,
    val registered: Boolean = false,
    val qrCode: String? = null,
    val confirmText: String = "",
    val error: String? = null,
    val message: String? = null,
    val navigateTo: String? = null,
)

data class EventFormUiState(
    val eventId: String = "",
    val isEdit: Boolean = false,
    val title: String = "",
    val description: String = "",
    val category: String = "ACADEMIC",
    val location: String = "",
    val capacity: String = "50",
    val date: String = "",
    val endDate: String = "",
    val roomId: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val message: String? = null,
    val navigateTo: String? = null,
)
