package com.smartcampus.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.smartcampus.mobile.core.navigation.AppNavHost
import com.smartcampus.mobile.core.ui.theme.SmartCampusTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val container = (application as SmartCampusApp).container

        setContent {
            SmartCampusTheme {
                AppNavHost(container = container)
            }
        }
    }
}
