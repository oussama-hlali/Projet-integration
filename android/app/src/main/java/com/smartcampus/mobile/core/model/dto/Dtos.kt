package com.smartcampus.mobile.core.model.dto

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String
)

data class MfaChallenge(
    @SerializedName("mfaRequired") val mfaRequired: Boolean = false,
    @SerializedName("setupRequired") val setupRequired: Boolean = false,
    @SerializedName("challengeId") val challengeId: String = "",
    @SerializedName("userId") val userId: String = ""
)

data class MfaSetupResponse(
    val secret: String = "",
    @SerializedName("otpauthUri") val otpauthUri: String = ""
)

data class MfaVerifyRequest(
    @SerializedName("challengeId") val challengeId: String,
    val code: String
)

data class SessionResponse(
    @SerializedName("accessToken") val accessToken: String = "",
    @SerializedName("expiresIn") val expiresIn: Int = 900,
    val user: UserDto = UserDto()
)

data class UserDto(
    val id: String = "",
    @SerializedName("fullName") val fullName: String = "",
    val email: String = "",
    val role: String = "",
    @SerializedName("totpEnabled") val totpEnabled: Boolean = false,
    val theme: String? = null,
    val language: String? = null,
    @SerializedName("notificationsEnabled") val notificationsEnabled: Boolean = true
)

data class RoomDto(
    val id: String = "",
    @SerializedName("buildingId") val buildingId: String = "",
    val name: String = "",
    val capacity: Int = 0,
    val status: String = "",
    val type: String? = null
)

data class AvailabilityDto(
    @SerializedName("roomId") val roomId: String = "",
    val available: Boolean = false
)

data class ReservationDto(
    val id: String = "",
    @SerializedName("roomId") val roomId: String = "",
    @SerializedName("roomName") val roomName: String? = null,
    @SerializedName("userId") val userId: String = "",
    @SerializedName("startTime") val startTime: String = "",
    @SerializedName("endTime") val endTime: String = "",
    val purpose: String? = null,
    val status: String = ""
)

data class EventDto(
    val id: String = "",
    val title: String = "",
    val description: String? = null,
    val category: String = "",
    val date: String = "",
    @SerializedName("endDate") val endDate: String? = null,
    val location: String? = null,
    val capacity: Int = 0,
    @SerializedName("organizerId") val organizerId: String? = null,
    @SerializedName("roomId") val roomId: String? = null,
    @SerializedName("createdAt") val createdAt: String = ""
)

data class AnnouncementDto(
    val id: String = "",
    val title: String = "",
    val body: String = "",
    val category: String = "",
    val pinned: Boolean = false,
    @SerializedName("authorId") val authorId: String? = null,
    @SerializedName("createdAt") val createdAt: String = ""
)

data class CafeteriaMenuDto(
    val id: String = "",
    @SerializedName("buildingId") val buildingId: String? = null,
    val building: String? = null,
    val date: String = "",
    val meal: String? = null,
    @SerializedName("openingHours") val openingHours: String? = null
)

data class MenuItemDto(
    val id: String = "",
    val name: String = "",
    val description: String? = null,
    val price: Double = 0.0,
    @SerializedName("dietaryLabelsCsv") val dietaryLabelsCsv: String? = null,
    @SerializedName("allergensCsv") val allergensCsv: String? = null
)

data class CafeteriaOrderDto(
    val id: String = "",
    val reference: String = "",
    @SerializedName("userId") val userId: String = "",
    @SerializedName("menuId") val menuId: String = "",
    @SerializedName("itemId") val itemId: String = "",
    @SerializedName("itemName") val itemName: String = "",
    @SerializedName("menuLabel") val menuLabel: String? = null,
    val building: String? = null,
    val date: String = "",
    @SerializedName("pickupTime") val pickupTime: String? = null,
    val price: Double = 0.0,
    val status: String = "",
    @SerializedName("qrPayload") val qrPayload: String = "",
    @SerializedName("idempotencyKey") val idempotencyKey: String? = null,
    @SerializedName("createdAt") val createdAt: String = ""
)

data class NotificationDto(
    val id: String = "",
    @SerializedName("userId") val userId: String = "",
    val type: String = "",
    val message: String = "",
    @SerializedName("eventId") val eventId: String? = null,
    val read: Boolean = false,
    @SerializedName("createdAt") val createdAt: String = ""
)

data class InterestDto(val interested: Boolean = false)

data class RegistrationDto(
    val id: String = "",
    @SerializedName("qrCode") val qrCode: String? = null
)

data class CancelOrderDto(val cancelled: Boolean = false)

data class UnreadCountDto(val count: Int = 0)
