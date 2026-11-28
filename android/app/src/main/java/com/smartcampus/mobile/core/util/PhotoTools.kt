package com.smartcampus.mobile.core.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.core.content.FileProvider
import java.io.ByteArrayOutputStream
import java.io.File

private const val JPEG_QUALITY = 70

/**
 * Réduit et encode une photo (caméra ou galerie) en JPEG base64 brut.
 * Aucun secret, aucun upload séparé : la photo voyage dans le post lost-found.
 */
class PhotoEncoder(private val context: Context) {

    fun encode(uri: Uri): String? {
        val source = context.contentResolver.openInputStream(uri)?.use { input ->
            BitmapFactory.decodeStream(input)
        } ?: return null

        val factor = scaleFactor(source.width, source.height)
        val bitmap = if (factor == 1.0) {
            source
        } else {
            val width = maxOf(1, (source.width * factor).toInt())
            val height = maxOf(1, (source.height * factor).toInt())
            Bitmap.createScaledBitmap(source, width, height, true)
        }

        val output = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, output)
        if (bitmap !== source) bitmap.recycle()
        source.recycle()
        return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
    }
}

/** Fichier temporaire partagé avec l'appareil photo via FileProvider. */
class PhotoFiles(private val context: Context) {

    fun newCameraUri(): Uri {
        val directory = File(context.externalFilesDir, "Pictures").apply { mkdirs() }
        val file = File.createTempFile("campus_photo_", ".jpg", directory)
        return FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
    }
}
