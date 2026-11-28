package com.smartcampus.mobile.feature.lostfound

import com.smartcampus.mobile.core.model.dto.LostFoundItemDto
import com.smartcampus.mobile.core.ui.formatIsoTime
import com.smartcampus.mobile.core.util.photoError

/** Modèle UI simple : l’écran n’affiche jamais directement le DTO Retrofit. */
data class LostFoundUiItem(
    val id: String,
    val title: String,
    val description: String,
    val status: String,
    val location: String,
    val category: String,
    val contactPhone: String,
    val createdAt: String,
    val photoData: String?,
    val reactions: Int,
)

fun LostFoundItemDto.toUi(): LostFoundUiItem = LostFoundUiItem(
    id = id,
    title = title,
    description = description.orEmpty(),
    status = status,
    location = location.orEmpty(),
    category = category.orEmpty(),
    contactPhone = contactPhone.orEmpty(),
    createdAt = formatIsoTime(createdAt),
    photoData = photoData,
    reactions = reactionUserIds.size,
)

/** Pure : validation partagée avec les tests, sans Android ni coroutine. */
fun lostFoundInputError(
    title: String,
    reporterId: String,
    status: String,
    photoData: String?,
): String? = when {
    title.isBlank() -> "Titre requis"
    title.length > 160 -> "Titre trop long"
    reporterId.isBlank() -> "Session introuvable"
    status !in listOf("LOST", "FOUND") -> "Statut invalide"
    else -> photoData?.let { photoError(it) }
}

data class LostFoundUiState(
    val loading: Boolean = true,
    val items: List<LostFoundUiItem> = emptyList(),
    val status: String? = null,
    val query: String = "",
    val error: String? = null,
    val navigateTo: String? = null,
)

data class LostFoundFormUiState(
    val loading: Boolean = false,
    val title: String = "",
    val description: String = "",
    val location: String = "",
    val category: String = "",
    val contactPhone: String = "",
    val status: String = "LOST",
    val photoData: String? = null,
    val cameraUri: String? = null,
    val error: String? = null,
    val message: String? = null,
    val navigateTo: String? = null,
)

data class LostFoundDetailUiState(
    val loading: Boolean = true,
    val item: LostFoundUiItem? = null,
    val error: String? = null,
    val message: String? = null,
)
