package com.smartcampus.mobile.core.ui

/** Format minimal pour afficher un Instant ISO sans librairies supplémentaires. */
fun formatIsoTime(value: String?): String =
    value?.takeIf { it.length >= 16 }?.take(16)?.replace("T", " ") ?: "—"
