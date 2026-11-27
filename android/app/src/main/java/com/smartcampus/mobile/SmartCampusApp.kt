package com.smartcampus.mobile

import android.app.Application
import com.smartcampus.mobile.di.AppContainer

class SmartCampusApp : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
