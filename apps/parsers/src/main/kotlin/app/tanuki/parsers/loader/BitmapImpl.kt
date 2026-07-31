package app.tanuki.parsers.loader

import org.koitharu.kotatsu.parsers.bitmap.Bitmap
import org.koitharu.kotatsu.parsers.bitmap.Rect
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO

/**
 * Реализация [Bitmap] нужна только для соответствия абстрактному классу
 * [org.koitharu.kotatsu.parsers.MangaLoaderContext]. Descrambling картинок ни один из
 * P0-источников Фазы 1 (Desu) не требует.
 */
class BitmapImpl(
    val image: BufferedImage,
) : Bitmap {
    override val width: Int get() = image.width
    override val height: Int get() = image.height

    override fun drawBitmap(
        sourceBitmap: Bitmap,
        src: Rect,
        dst: Rect,
    ) {
        val source = (sourceBitmap as BitmapImpl).image
        val graphics = image.createGraphics()
        try {
            graphics.drawImage(
                source,
                dst.left,
                dst.top,
                dst.right,
                dst.bottom,
                src.left,
                src.top,
                src.right,
                src.bottom,
                null,
            )
        } finally {
            graphics.dispose()
        }
    }

    fun toPngBytes(): ByteArray =
        ByteArrayOutputStream().use { out ->
            ImageIO.write(image, "png", out)
            out.toByteArray()
        }
}
