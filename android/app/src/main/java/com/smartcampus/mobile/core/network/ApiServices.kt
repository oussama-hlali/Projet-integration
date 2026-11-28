package com.smartcampus.mobile.core.network

import com.smartcampus.mobile.core.model.dto.AnnouncementDto
import com.smartcampus.mobile.core.model.dto.AvailabilityDto
import com.smartcampus.mobile.core.model.dto.CafeteriaMenuDto
import com.smartcampus.mobile.core.model.dto.CafeteriaOrderDto
import com.smartcampus.mobile.core.model.dto.CancelOrderDto
import com.smartcampus.mobile.core.model.dto.EventDto
import com.smartcampus.mobile.core.model.dto.InterestDto
import com.smartcampus.mobile.core.model.dto.LoginRequest
import com.smartcampus.mobile.core.model.dto.LostFoundItemDto
import com.smartcampus.mobile.core.model.dto.MfaChallenge
import com.smartcampus.mobile.core.model.dto.MfaSetupResponse
import com.smartcampus.mobile.core.model.dto.MfaVerifyRequest
import com.smartcampus.mobile.core.model.dto.NotificationDto
import com.smartcampus.mobile.core.model.dto.RegistrationDto
import com.smartcampus.mobile.core.model.dto.RegistrationStatusDto
import com.smartcampus.mobile.core.model.dto.ReservationDto
import com.smartcampus.mobile.core.model.dto.RoomDto
import com.smartcampus.mobile.core.model.dto.SessionResponse
import com.smartcampus.mobile.core.model.dto.UnreadCountDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

object ApiServices {

    interface AuthApi {
        @POST("auth/login")
        suspend fun login(@Body request: LoginRequest): MfaChallenge

        @POST("auth/mfa/setup")
        suspend fun mfaSetup(@Body body: Map<String, String>): MfaSetupResponse

        @POST("auth/mfa/verify")
        suspend fun verifyMfa(@Body request: MfaVerifyRequest): SessionResponse

        @POST("auth/refresh")
        suspend fun refresh(
            @Header("X-CSRF-Protected") csrf: String = "1"
        ): SessionResponse

        @POST("auth/logout")
        suspend fun logout(
            @Header("X-CSRF-Protected") csrf: String = "1"
        )
    }

    interface SmartApi {
        @GET("rooms")
        suspend fun rooms(
            @Query("buildingId") buildingId: String? = null,
            @Query("status") status: String? = null,
            @Query("type") type: String? = null,
            @Query("minCapacity") minCapacity: Int? = null,
            @Query("q") q: String? = null
        ): List<RoomDto>

        @GET("rooms/{id}")
        suspend fun room(@Path("id") id: String): RoomDto

        @GET("rooms/{id}/availability")
        suspend fun availability(
            @Path("id") id: String,
            @Query("from") from: String,
            @Query("to") to: String
        ): AvailabilityDto

        @GET("reservations")
        suspend fun reservations(
            @Query("userId") userId: String? = null,
            @Query("status") status: String? = null
        ): List<ReservationDto>

        @GET("reservations/{id}")
        suspend fun reservation(@Path("id") id: String): ReservationDto

        @POST("reservations")
        suspend fun createReservation(@Body body: Map<String, Any>): ReservationDto

        @POST("reservations/{id}/confirm")
        suspend fun confirmReservation(@Path("id") id: String): ReservationDto

        @POST("reservations/{id}/cancel")
        suspend fun cancelReservation(@Path("id") id: String): ReservationDto

        @POST("reservations/{id}/complete")
        suspend fun completeReservation(@Path("id") id: String): ReservationDto

        @GET("events")
        suspend fun events(
            @Query("category") category: String? = null,
            @Query("from") from: String? = null,
            @Query("to") to: String? = null
        ): List<EventDto>

        @GET("events/{id}")
        suspend fun event(@Path("id") id: String): EventDto

        @GET("events/for-you")
        suspend fun eventsForYou(
            @Query("userId") userId: String,
            @Query("limit") limit: Int = 6
        ): List<EventDto>

        @POST("events")
        suspend fun createEvent(@Body body: Map<String, Any>): EventDto

        @PUT("events/{id}")
        suspend fun updateEvent(
            @Path("id") id: String,
            @Body body: Map<String, Any>
        ): EventDto

        @DELETE("events/{id}")
        suspend fun deleteEvent(@Path("id") id: String)

        @GET("events/{id}/interest")
        suspend fun interestStatus(
            @Path("id") id: String,
            @Query("userId") userId: String
        ): InterestDto

        @PUT("events/{id}/interest")
        suspend fun toggleInterest(
            @Path("id") id: String,
            @Query("userId") userId: String
        ): InterestDto

        @GET("events/{id}/registrations/me")
        suspend fun myRegistration(
            @Path("id") id: String,
            @Query("userId") userId: String
        ): RegistrationStatusDto

        @POST("events/{id}/registrations")
        suspend fun registerToEvent(
            @Path("id") id: String,
            @Query("userId") userId: String
        ): RegistrationDto

        @DELETE("events/{id}/registrations/me")
        suspend fun unregisterFromEvent(
            @Path("id") id: String,
            @Query("userId") userId: String
        )

        @GET("announcements")
        suspend fun announcements(): List<AnnouncementDto>

        @GET("announcements/{id}")
        suspend fun announcement(@Path("id") id: String): AnnouncementDto

        @POST("announcements")
        suspend fun createAnnouncement(@Body body: Map<String, Any>): AnnouncementDto

        @PUT("announcements/{id}")
        suspend fun updateAnnouncement(
            @Path("id") id: String,
            @Body body: Map<String, Any>
        ): AnnouncementDto

        @DELETE("announcements/{id}")
        suspend fun deleteAnnouncement(@Path("id") id: String)

        @GET("menus/today")
        suspend fun todayMenu(): CafeteriaMenuDto

        @GET("menus/{id}/items")
        suspend fun menuItems(@Path("id") id: String): List<com.smartcampus.mobile.core.model.dto.MenuItemDto>

        @POST("orders")
        suspend fun reserveOrder(
            @Header("Idempotency-Key") key: String,
            @Body body: Map<String, Any>
        ): CafeteriaOrderDto

        @GET("orders")
        suspend fun orders(@Query("userId") userId: String): List<CafeteriaOrderDto>

        @POST("orders/{id}/cancel")
        suspend fun cancelOrder(
            @Path("id") id: String,
            @Query("userId") userId: String
        ): CancelOrderDto

        @GET("notifications")
        suspend fun notifications(@Query("userId") userId: String): List<NotificationDto>

        @GET("notifications/unread-count")
        suspend fun unreadCount(@Query("userId") userId: String): UnreadCountDto

        @PATCH("notifications/{id}")
        suspend fun markNotificationRead(
            @Path("id") id: String,
            @Body body: Map<String, Boolean>
        ): NotificationDto

        @POST("notifications/read-all")
        suspend fun readAllNotifications(@Query("userId") userId: String): Map<String, Boolean>

        @DELETE("notifications/{id}")
        suspend fun deleteNotification(@Path("id") id: String)

        @GET("lost-found")
        suspend fun lostFound(
            @Query("status") status: String? = null,
            @Query("q") q: String? = null
        ): List<LostFoundItemDto>

        @GET("lost-found/{id}")
        suspend fun lostFoundItem(@Path("id") id: String): LostFoundItemDto

        @POST("lost-found")
        suspend fun createLostFound(@Body body: Map<String, Any>): LostFoundItemDto

        @POST("lost-found/{id}/claim")
        suspend fun claimLostFound(@Path("id") id: String): LostFoundItemDto
    }
}
