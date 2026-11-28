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
import com.smartcampus.mobile.feature.announcements.AnnouncementDetailScreen
import com.smartcampus.mobile.feature.announcements.AnnouncementDetailViewModel
import com.smartcampus.mobile.feature.announcements.AnnouncementFormScreen
import com.smartcampus.mobile.feature.announcements.AnnouncementFormViewModel
import com.smartcampus.mobile.feature.announcements.AnnouncementsScreen
import com.smartcampus.mobile.feature.announcements.AnnouncementsViewModel
import com.smartcampus.mobile.feature.auth.AuthViewModel
import com.smartcampus.mobile.feature.auth.LoginScreen
import com.smartcampus.mobile.feature.cafeteria.CafeteriaScreen
import com.smartcampus.mobile.feature.cafeteria.CafeteriaViewModel
import com.smartcampus.mobile.feature.cafeteria.OrdersScreen
import com.smartcampus.mobile.feature.cafeteria.OrdersViewModel
import com.smartcampus.mobile.feature.auth.MfaSetupScreen
import com.smartcampus.mobile.feature.auth.MfaVerifyScreen
import com.smartcampus.mobile.feature.events.EventDetailScreen
import com.smartcampus.mobile.feature.events.EventDetailViewModel
import com.smartcampus.mobile.feature.events.EventFormScreen
import com.smartcampus.mobile.feature.events.EventFormViewModel
import com.smartcampus.mobile.feature.events.EventsScreen
import com.smartcampus.mobile.feature.events.EventsViewModel
import com.smartcampus.mobile.feature.home.HomeScreen
import com.smartcampus.mobile.feature.home.HomeViewModel
import com.smartcampus.mobile.feature.lostfound.LostFoundDetailScreen
import com.smartcampus.mobile.feature.lostfound.LostFoundDetailViewModel
import com.smartcampus.mobile.feature.lostfound.LostFoundFormScreen
import com.smartcampus.mobile.feature.lostfound.LostFoundFormViewModel
import com.smartcampus.mobile.feature.lostfound.LostFoundScreen
import com.smartcampus.mobile.feature.lostfound.LostFoundViewModel
import com.smartcampus.mobile.feature.notifications.NotificationsScreen
import com.smartcampus.mobile.feature.notifications.NotificationsViewModel
import com.smartcampus.mobile.feature.profile.ProfileScreen
import com.smartcampus.mobile.feature.profile.ProfileViewModel
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
        if (destination == "reservations" ||
            destination == "events" ||
            destination == "announcements" ||
            destination == "orders" ||
            destination == "lost_found"
        ) {
            navController.navigate(destination) {
                popUpTo(destination) { inclusive = true }
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

        composable("events") {
            val eventsViewModel: EventsViewModel = viewModel(
                factory = container.eventsViewModelFactory()
            )
            EventsScreen(
                viewModel = eventsViewModel,
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("event_detail/{id}") { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id").orEmpty()
            val detailViewModel: EventDetailViewModel = viewModel(
                factory = container.eventDetailViewModelFactory(id)
            )
            EventDetailScreen(
                viewModel = detailViewModel,
                onBack = { navController.popBackStack() },
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("event_form/{id}") { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id").orEmpty()
            val formViewModel: EventFormViewModel = viewModel(
                factory = container.eventFormViewModelFactory(id)
            )
            EventFormScreen(
                viewModel = formViewModel,
                onBack = { navController.popBackStack() },
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("announcements") {
            val announcementsViewModel: AnnouncementsViewModel = viewModel(
                factory = container.announcementsViewModelFactory()
            )
            AnnouncementsScreen(
                viewModel = announcementsViewModel,
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("announcement_detail/{id}") { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id").orEmpty()
            val detailViewModel: AnnouncementDetailViewModel = viewModel(
                factory = container.announcementDetailViewModelFactory(id)
            )
            AnnouncementDetailScreen(
                viewModel = detailViewModel,
                onBack = { navController.popBackStack() },
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("announcement_form/{id}") { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id").orEmpty()
            val formViewModel: AnnouncementFormViewModel = viewModel(
                factory = container.announcementFormViewModelFactory(id)
            )
            AnnouncementFormScreen(
                viewModel = formViewModel,
                onBack = { navController.popBackStack() },
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("notifications") {
            val notificationsViewModel: NotificationsViewModel = viewModel(
                factory = container.notificationsViewModelFactory()
            )
            NotificationsScreen(viewModel = notificationsViewModel)
        }

        composable("cafeteria") {
            val cafeteriaViewModel: CafeteriaViewModel = viewModel(
                factory = container.cafeteriaViewModelFactory()
            )
            CafeteriaScreen(
                viewModel = cafeteriaViewModel,
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("orders") {
            val ordersViewModel: OrdersViewModel = viewModel(
                factory = container.ordersViewModelFactory()
            )
            OrdersScreen(viewModel = ordersViewModel)
        }

        composable("lost_found") {
            val lostFoundViewModel: LostFoundViewModel = viewModel(
                factory = container.lostFoundViewModelFactory()
            )
            LostFoundScreen(
                viewModel = lostFoundViewModel,
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("lost_found_form") {
            val formViewModel: LostFoundFormViewModel = viewModel(
                factory = container.lostFoundFormViewModelFactory()
            )
            LostFoundFormScreen(
                viewModel = formViewModel,
                onBack = { navController.popBackStack() },
                onNavigate = { destination -> navigate(destination) },
            )
        }

        composable("lost_found_detail/{id}") { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id").orEmpty()
            val detailViewModel: LostFoundDetailViewModel = viewModel(
                factory = container.lostFoundDetailViewModelFactory(id)
            )
            LostFoundDetailScreen(
                viewModel = detailViewModel,
                onBack = { navController.popBackStack() },
            )
        }

        composable("profile") {
            val profileViewModel: ProfileViewModel = viewModel(
                factory = container.profileViewModelFactory()
            )
            ProfileScreen(
                viewModel = profileViewModel,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
