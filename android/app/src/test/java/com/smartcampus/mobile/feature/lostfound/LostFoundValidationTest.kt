package com.smartcampus.mobile.feature.lostfound

import com.smartcampus.mobile.core.model.dto.LostFoundItemDto
import com.smartcampus.mobile.core.util.MAX_PHOTO_CHARS
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class LostFoundValidationTest {

    private val userId = "u1"

    @Test
    fun validInputHasNoError() {
        assertNull(lostFoundInputError("Wallet", userId, "LOST", null))
    }

    @Test
    fun titleIsRequired() {
        assertEquals("Titre requis", lostFoundInputError("  ", userId, "LOST", null))
    }

    @Test
    fun reporterIsRequired() {
        assertEquals("Session introuvable", lostFoundInputError("Wallet", "", "LOST", null))
    }

    @Test
    fun onlyLostAndFoundAreAllowedOnCreate() {
        assertEquals(
            "Statut invalide",
            lostFoundInputError("Wallet", userId, "CLAIMED", null)
        )
    }

    @Test
    fun oversizedPhotoIsRejected() {
        assertEquals(
            "Photo trop volumineuse",
            lostFoundInputError(
                "Wallet",
                userId,
                "FOUND",
                "A".repeat(MAX_PHOTO_CHARS + 1),
            )
        )
    }

    @Test
    fun mappingKeepsPhotoAndReactions() {
        val ui = LostFoundItemDto(
            id = "lf1",
            title = "Wallet",
            photoData = "YWJj",
            reactionUserIds = listOf("a", "b"),
        ).toUi()

        assertEquals("Wallet", ui.title)
        assertEquals("YWJj", ui.photoData)
        assertEquals(2, ui.reactions)
    }
}
