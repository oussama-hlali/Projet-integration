package com.smartcampus.mobile.core.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** Tests JVM simples : aucune classe Android n’est chargée ici. */
class PhotoRulesTest {

    @Test
    fun smallPhotoKeepsItsSize() {
        assertEquals(1.0, scaleFactor(800, 600), 0.0001)
    }

    @Test
    fun largePhotoIsReducedToMaxSide() {
        assertEquals(0.25, scaleFactor(4000, 3000), 0.0001)
    }

    @Test
    fun missingPhotoIsRejected() {
        assertEquals("Photo introuvable", photoError(null))
    }

    @Test
    fun oversizedPhotoIsRejected() {
        assertEquals("Photo trop volumineuse", photoError("A".repeat(MAX_PHOTO_CHARS + 1)))
    }

    @Test
    fun validPhotoIsAccepted() {
        assertNull(photoError("YWJj"))
    }
}
