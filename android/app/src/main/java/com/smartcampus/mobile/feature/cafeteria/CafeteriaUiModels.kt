package com.smartcampus.mobile.feature.cafeteria

import com.smartcampus.mobile.core.model.dto.CafeteriaMenuDto
import com.smartcampus.mobile.core.model.dto.CafeteriaOrderDto
import com.smartcampus.mobile.core.model.dto.MenuItemDto
import com.smartcampus.mobile.core.ui.formatIsoTime

/** Modèles UI simples : les Composables n’affichent jamais directement les DTO Retrofit. */
data class MenuUiItem(
    val id: String,
    val meal: String,
    val building: String,
    val openingHours: String,
    val date: String,
)

fun CafeteriaMenuDto.toUi(): MenuUiItem = MenuUiItem(
    id = id,
    meal = meal.orEmpty(),
    building = building.orEmpty(),
    openingHours = openingHours.orEmpty(),
    date = formatIsoTime(date),
)

data class MenuItemUiItem(
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val dietaryLabelsCsv: String,
    val allergensCsv: String,
)

fun MenuItemDto.toUi(): MenuItemUiItem = MenuItemUiItem(
    id = id,
    name = name,
    description = description.orEmpty(),
    price = price,
    dietaryLabelsCsv = dietaryLabelsCsv.orEmpty(),
    allergensCsv = allergensCsv.orEmpty(),
)

data class OrderUiItem(
    val id: String,
    val reference: String,
    val itemName: String,
    val menuLabel: String,
    val price: Double,
    val status: String,
    val qrPayload: String,
    val pickupTime: String,
)

fun CafeteriaOrderDto.toUi(): OrderUiItem = OrderUiItem(
    id = id,
    reference = reference,
    itemName = itemName,
    menuLabel = menuLabel.orEmpty(),
    price = price,
    status = status,
    qrPayload = qrPayload,
    pickupTime = pickupTime.orEmpty(),
)

/** Pure : CANCELLED reste dans le backend mais sort de la liste active. */
fun List<CafeteriaOrderDto>.activeOnly(): List<CafeteriaOrderDto> =
    filterNot { it.status.equals("CANCELLED", ignoreCase = true) }

data class CafeteriaUiState(
    val loading: Boolean = false,
    val menu: MenuUiItem? = null,
    val items: List<MenuItemUiItem> = emptyList(),
    val error: String? = null,
    val message: String? = null,
    val navigateTo: String? = null,
)

data class OrdersUiState(
    val loading: Boolean = false,
    val items: List<OrderUiItem> = emptyList(),
    val error: String? = null,
    val message: String? = null,
)
