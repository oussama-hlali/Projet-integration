package com.smartcampus.mobile.core.util

/** Limites partagées avec le backend engagement (voir MAX_PHOTO_CHARS côté Java). */
const val MAX_PHOTO_CHARS = 2_000_000
const val MAX_PHOTO_SIDE = 1024

/** Pure : facteur pour réduire le plus grand côté à MAX_PHOTO_SIDE. */
fun scaleFactor(width: Int, height: Int, maxSide: Int = MAX_PHOTO_SIDE): Double {
    val longest = maxOf(width, height)
    return if (longest <= 0 || longest <= maxSide) 1.0 else maxSide.toDouble() / longest
}

/** Pure : erreur éventuelle sur une photo encodée en base64. */
fun photoError(base64: String?, maxChars: Int = MAX_PHOTO_CHARS): String? = when {
    base64.isNullOrEmpty() -> "Photo introuvable"
    base64.length > maxChars -> "Photo trop volumineuse"
    else -> null
}
