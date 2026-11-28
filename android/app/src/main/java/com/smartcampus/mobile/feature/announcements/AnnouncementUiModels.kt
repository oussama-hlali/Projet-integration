package com.smartcampus.mobile.feature.announcements

import com.smartcampus.mobile.core.model.dto.AnnouncementDto
import com.smartcampus.mobile.core.ui.formatIsoTime

data class AnnouncementUiItem(
    val id: String,
    val title: String,
    val body: String,
    val category: String,
    val pinned: Boolean,
    val createdAt: String,
)

fun AnnouncementDto.toUi(): AnnouncementUiItem = AnnouncementUiItem(
    id = id,
    title = title,
    body = body,
    category = category,
    pinned = pinned,
    createdAt = formatIsoTime(createdAt),
)

data class AnnouncementsUiState(
    val loading: Boolean = false,
    val items: List<AnnouncementUiItem> = emptyList(),
    val error: String? = null,
    val isAdmin: Boolean = false,
    val navigateTo: String? = null,
)

data class AnnouncementDetailUiState(
    val loading: Boolean = false,
    val item: AnnouncementUiItem? = null,
    val isAdmin: Boolean = false,
    val confirmText: String = "",
    val error: String? = null,
    val message: String? = null,
    val navigateTo: String? = null,
)

data class AnnouncementFormUiState(
    val announcementId: String = "",
    val isEdit: Boolean = false,
    val title: String = "",
    val body: String = "",
    val category: String = "GENERAL",
    val pinned: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
    val message: String? = null,
    val navigateTo: String? = null,
)
