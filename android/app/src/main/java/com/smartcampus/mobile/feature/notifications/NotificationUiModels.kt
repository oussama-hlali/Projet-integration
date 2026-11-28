package com.smartcampus.mobile.feature.notifications

import com.smartcampus.mobile.core.model.dto.NotificationDto
import com.smartcampus.mobile.core.ui.formatIsoTime

/** Modèle UI simple : le Composable n’affiche jamais directement le DTO Retrofit. */
data class NotificationUiItem(
    val id: String,
    val type: String,
    val message: String,
    val createdAt: String,
    val read: Boolean,
)

fun NotificationDto.toUi(): NotificationUiItem = NotificationUiItem(
    id = id,
    type = type,
    message = message,
    createdAt = formatIsoTime(createdAt),
    read = read,
)

data class NotificationsUiState(
    val loading: Boolean = false,
    val items: List<NotificationUiItem> = emptyList(),
    val unreadCount: Int = 0,
    val error: String? = null,
    val message: String? = null,
)
