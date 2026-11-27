package com.smartcampus.mobile.core.network

import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

/**
 * CookieJar simple : il garde le cookie de refresh sc_refresh en mémoire.
 * Version volontairement débutant : pas de persistance sur disque.
 */
class SessionCookieJar : CookieJar {

    private val cookies = mutableMapOf<String, List<Cookie>>()

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        this.cookies[url.host] = cookies
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        return cookies[url.host].orEmpty()
    }

    fun clear() {
        cookies.clear()
    }
}
