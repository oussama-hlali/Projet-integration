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
    val authState by authViewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(authState.navigateTo) {
        authState.navigateTo?.let { destination ->
            navController.navigate(destination) {
                popUpTo("splash") { inclusive = true }
            }
            authViewModel.consumeNavigation()
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
            HomeScreen(
                repository = container.authRepository,
                prefs = container.prefs,
                onLogout = {
                    navController.navigate("login") {
                        popUpTo("home") { inclusive = true }
                    }
                }
            )
        }
    }
}
