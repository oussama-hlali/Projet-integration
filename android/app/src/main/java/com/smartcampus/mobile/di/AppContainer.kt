package com.smartcampus.mobile.di

import android.content.Context

/**
 * Conteneur simple, sans Hilt ni Koin.
 * Il sera enrichi au fur et à mesure des parties.
 */
class AppContainer(private val context: Context) {

    val appContext: Context = context.applicationContext
}
