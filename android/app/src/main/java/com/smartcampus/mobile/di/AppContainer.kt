package com.smartcampus.mobile.di

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.smartcampus.mobile.core.datastore.UserPreferences
import com.smartcampus.mobile.core.network.ApiClient
import com.smartcampus.mobile.core.network.AuthInterceptor
import com.smartcampus.mobile.core.network.SessionCookieJar
import com.smartcampus.mobile.core.network.TokenHolder
import com.smartcampus.mobile.core.repository.SmartCampusRepository
import com.smartcampus.mobile.feature.auth.AuthRepository
import com.smartcampus.mobile.feature.auth.AuthViewModel
import com.smartcampus.mobile.feature.home.HomeViewModel
import com.smartcampus.mobile.feature.reservations.ReservationDetailViewModel
import com.smartcampus.mobile.feature.reservations.ReservationNewViewModel
import com.smartcampus.mobile.feature.reservations.ReservationsViewModel
import com.smartcampus.mobile.feature.rooms.RoomDetailViewModel
import com.smartcampus.mobile.feature.rooms.RoomsViewModel
import com.smartcampus.mobile.feature.splash.SplashViewModel

/**
 * Conteneur simple, sans Hilt ni Koin.
 * Chaque objet est créé une seule fois quand l’application démarre.
 */
class AppContainer(private val context: Context) {

    val appContext: Context = context.applicationContext

    val tokenHolder = TokenHolder

    val cookieJar = SessionCookieJar()

    private val authInterceptor = AuthInterceptor(tokenHolder)

    val apiClient = ApiClient(cookieJar, authInterceptor)

    val prefs = UserPreferences(appContext)

    val authRepository = AuthRepository(
        api = apiClient.authApi,
        apiClient = apiClient,
        tokenHolder = tokenHolder,
        cookieJar = cookieJar,
        prefs = prefs
    )

    val smartCampusRepository = SmartCampusRepository(
        api = apiClient.smartApi,
        apiClient = apiClient
    )

    fun authViewModelFactory() = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AuthViewModel(authRepository) as T
        }
    }

    fun splashViewModelFactory() = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return SplashViewModel(authRepository, prefs) as T
        }
    }

    fun homeViewModelFactory() = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return HomeViewModel(authRepository, prefs) as T
        }
    }

    fun roomsViewModelFactory() = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return RoomsViewModel(smartCampusRepository, prefs) as T
        }
    }

    fun roomDetailViewModelFactory(roomId: String) = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return RoomDetailViewModel(smartCampusRepository, roomId) as T
        }
    }

    fun reservationsViewModelFactory() = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ReservationsViewModel(smartCampusRepository, prefs) as T
        }
    }

    fun reservationDetailViewModelFactory(id: String) = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ReservationDetailViewModel(smartCampusRepository, id) as T
        }
    }

    fun reservationNewViewModelFactory(roomId: String) = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ReservationNewViewModel(smartCampusRepository, prefs, roomId) as T
        }
    }
}
