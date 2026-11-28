package com.smartcampus.mobile.core.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.smartcampus.mobile.di.AppContainer
import com.smartcampus.mobile.feature.auth.AuthViewModel
import com.smartcampus.mobile.feature.auth.LoginScreen
import com.smartcampus.mobile.feature.auth.MfaSetupScreen
import com.smartcampus.mobile.feature.auth.MfaVerifyScreen
import com.smartcampus.mobile.feature.home.HomeScreen
import com.smartcampus.mobile.feature.home.HomeViewModel
import com.smartcampus.mobile.feature.reservations.ReservationDetailScreen
import com.smartcampus.mobile.feature.reservations.ReservationDetailViewModel
import com.smartcampus.mobile.feature.reservations.ReservationNewScreen
import com.smartcampus.mobile.feature.reservations.ReservationNewViewModel
import com.smartcampus.mobile.feature.reservations.ReservationsScreen
import com.smartcampus.mobile.feature.reservations.ReservationsViewModel
import com.smartcampus.mobile.feature.rooms.RoomDetailScreen
import com.smartcampus.mobile.feature.rooms.RoomDetailViewModel
import com.smartcampus.mobile.feature.rooms.RoomsScreen
import com.smartcampus.mobile.feature.rooms.RoomsViewModel
import com.smartcampus.mobile.feature.splash.SplashScreen
import com.smartcampus.mobile.feature.splash.SplashViewModel

@Composable
fun AppNavHost(container: AppContainer) {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel(
        factory = container.authViewModelFactory()
    )
    val splashViewModel: SplashViewModel = viewModel(
        factory = container.splashViewModelFactory()
    )
    val homeViewModel: HomeViewModel = viewModel(
        factory = container.homeViewModelFactory()
    )
    val authState by authViewModel.state.collectAsStateWithLifecycle()
    val homeState by homeViewModel.state.collectAsStateWithLifecycle()

    fun navigate(destination: String) {
        if (destination == "reservations") {
            navController.navigate(destination) {
                popUpTo("reservations") { inclusive = true }
            }
        } else {
            navController.navigate(destination)
        }
    }

    LaunchedEffect(authState.navigateTo) {
        authState.navigateTo?.let { destination ->
            navController.navigate(destination) {
                popUpTo("splash") { inclusive = true }
            }
            authViewModel.consumeNavigation()
        }
    }

    LaunchedEffect(homeState.navigateTo) {
        homeState.navigateTo?.let { destination ->
            if (destination == "login") {
                navController.navigate("login") {
                    popUpTo("home") { inclusive = true }
                }
            } else {
                navigate(destination)
            }
            homeViewModel.consumeNavigation()
        }
    }

    NavHost(navController = navController, startDestination = "splash") {
        composable("splash") {
            SplashScreen(
                viewModel = splashViewModel,
                onReady = { authenticated ->
                    navController.navigate(if (authenticated) "home" else "login") {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            )
        }

        composable("login") {
            LoginScreen(viewModel = authViewModel)
        }

        composable("mfa_setup") {
            MfaSetupScreen(viewModel = authViewModel)
        }

        composable("mfa_verify") {
            MfaVerifyScreen(viewModel = authViewModel)
        }

        composable("home") {
            LaunchedEffect(Unit) {
                homeViewModel.refresh()
            }
            HomeScreen(viewModel = homeViewModel)
        }

        composable("rooms") {
            val roomsViewModel: RoomsViewModel = viewModel(
                factory = container.roomsViewModelFactory()
            )
            RoomsScreen(
                viewModel = roomsViewModel,
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("room_detail/{roomId}") { backStackEntry ->
            val roomId = backStackEntry.arguments?.getString("roomId").orEmpty()
            val detailViewModel: RoomDetailViewModel = viewModel(
                factory = container.roomDetailViewModelFactory(roomId)
            )
            RoomDetailScreen(
                viewModel = detailViewModel,
                onBack = { navController.popBackStack() },
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("reservation_new/{roomId}") { backStackEntry ->
            val roomId = backStackEntry.arguments?.getString("roomId").orEmpty()
            val newViewModel: ReservationNewViewModel = viewModel(
                factory = container.reservationNewViewModelFactory(roomId)
            )
            ReservationNewScreen(
                viewModel = newViewModel,
                onBack = { navController.popBackStack() },
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("reservations") {
            val reservationsViewModel: ReservationsViewModel = viewModel(
                factory = container.reservationsViewModelFactory()
            )
            ReservationsScreen(
                viewModel = reservationsViewModel,
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("reservation_detail/{id}") { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id").orEmpty()
            val detailViewModel: ReservationDetailViewModel = viewModel(
                factory = container.reservationDetailViewModelFactory(id)
            )
            ReservationDetailScreen(
                viewModel = detailViewModel,
                onBack = { navController.popBackStack() },
                onNavigate = { destination -> navigate(destination) },
            )
        }
    }
}
