package com.smartcampus.mobile.core.repository

import com.smartcampus.mobile.core.model.dto.AnnouncementDto
import com.smartcampus.mobile.core.model.dto.AvailabilityDto
import com.smartcampus.mobile.core.model.dto.CafeteriaOrderDto
import com.smartcampus.mobile.core.model.dto.EventDto
import com.smartcampus.mobile.core.model.dto.MenuItemDto
import com.smartcampus.mobile.core.model.dto.NotificationDto
import com.smartcampus.mobile.core.model.dto.ReservationDto
import com.smartcampus.mobile.core.model.dto.RoomDto
import com.smartcampus.mobile.core.network.ApiClient
import com.smartcampus.mobile.core.network.ApiServices.SmartApi
import retrofit2.HttpException
import java.io.IOException

/**
 * Repository unique pour les données du campus.
 * Volontairement simple : une fonction par action.
 */
class SmartCampusRepository(
    private val api: SmartApi,
    private val apiClient: ApiClient
) {

    suspend fun rooms(query: String? = null): List<RoomDto> =
        safeCall { api.rooms(q = query) }

    suspend fun room(id: String): RoomDto =
        safeCall { api.room(id) }

    suspend fun availability(roomId: String, from: String, to: String): AvailabilityDto =
        safeCall { api.availability(roomId, from, to) }

    suspend fun reservations(userId: String): List<ReservationDto> =
        safeCall { api.reservations(userId = userId) }

    suspend fun reservation(id: String): ReservationDto =
        safeCall { api.reservation(id) }

    suspend fun createReservation(body: Map<String, Any>): ReservationDto =
        safeCall { api.createReservation(body) }

    suspend fun cancelReservation(id: String): ReservationDto =
        safeCall { api.cancelReservation(id) }

    suspend fun events(): List<EventDto> =
        safeCall { api.events() }

    suspend fun announcements(): List<AnnouncementDto> =
        safeCall { api.announcements() }

    suspend fun menuItems(menuId: String): List<MenuItemDto> =
        safeCall { api.menuItems(menuId) }

    suspend fun reserveOrder(key: String, body: Map<String, Any>): CafeteriaOrderDto =
        safeCall { api.reserveOrder(key, body) }

    suspend fun notifications(userId: String): List<NotificationDto> =
        safeCall { api.notifications(userId) }

    suspend fun markNotificationRead(id: String) {
        safeCall { api.markNotificationRead(id, mapOf("read" to true)) }
    }

    private suspend fun <T> safeCall(block: suspend () -> T): T {
        return try {
            block()
        } catch (e: HttpException) {
            throw Exception(apiClient.parseError(e.response().errorBody()))
        } catch (e: IOException) {
            throw Exception("Service indisponible")
        }
    }
}
