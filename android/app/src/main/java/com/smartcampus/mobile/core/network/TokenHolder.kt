package com.smartcampus.mobile.core.network

/**
 * Le token d’accès reste seulement en mémoire.
 * Il n’est jamais écrit dans DataStore.
 */
object TokenHolder {

    @Volatile
    var accessToken: String? = null
        private set

    fun save(token: String) {
        accessToken = token
    }

    fun clear() {
        accessToken = null
    }
}
