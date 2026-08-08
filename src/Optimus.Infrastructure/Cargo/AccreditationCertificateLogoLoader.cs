using Optimus.Infrastructure.Storage;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace Optimus.Infrastructure.Cargo;

internal static class AccreditationCertificateLogoLoader
{
    // Embed ~2.5x the PDF point size so logos stay sharp on screen and print (~180 DPI).
    private const double EmbedPixelsPerPoint = 2.5;
    private const int JpegQuality = 95;

    public static PdfEmbeddedImage? TryLoad(
        string uploadRoot,
        string? logoPath,
        double maxDisplayWidthPt = 300,
        double maxDisplayHeightPt = 120,
        double maxDisplayWatermarkPt = 440)
    {
        var fullPath = FileStoragePaths.ResolveExistingFile(uploadRoot, logoPath);
        if (fullPath == null)
        {
            return null;
        }

        try
        {
            var targetMaxWidth = (int)Math.Ceiling(
                Math.Max(maxDisplayWidthPt, maxDisplayWatermarkPt) * EmbedPixelsPerPoint);
            var targetMaxHeight = (int)Math.Ceiling(
                Math.Max(maxDisplayHeightPt, maxDisplayWatermarkPt) * EmbedPixelsPerPoint);
            return LoadFromPath(fullPath, targetMaxWidth, targetMaxHeight);
        }
        catch
        {
            return null;
        }
    }

    public static PdfEmbeddedImage CreateWhiteOnBrandCopy(
        PdfEmbeddedImage source,
        int targetMaxWidth,
        int targetMaxHeight,
        byte brandR,
        byte brandG,
        byte brandB)
    {
        var brandBackground = Color.FromRgb(brandR, brandG, brandB);
        using var image = Image.Load<Rgba32>(source.JpegBytes);
        var scale = Math.Min(1d, Math.Min(
            (double)targetMaxWidth / image.Width,
            (double)targetMaxHeight / image.Height));

        if (scale < 1d)
        {
            var newWidth = Math.Max(1, (int)Math.Round(image.Width * scale));
            var newHeight = Math.Max(1, (int)Math.Round(image.Height * scale));
            image.Mutate(ctx => ctx.Resize(new ResizeOptions
            {
                Size = new Size(newWidth, newHeight),
                Mode = ResizeMode.Stretch,
                Sampler = KnownResamplers.Lanczos3,
            }));
        }

        using var output = new Image<Rgba32>(image.Width, image.Height, brandBackground);
        image.ProcessPixelRows(sourceAccessor =>
        {
            for (var y = 0; y < image.Height; y++)
            {
                var sourceRow = sourceAccessor.GetRowSpan(y);
                for (var x = 0; x < sourceRow.Length; x++)
                {
                    if (IsLogoPixel(sourceRow[x]))
                    {
                        output[x, y] = Color.White;
                    }
                }
            }
        });

        using var ms = new MemoryStream();
        output.SaveAsJpeg(ms, new JpegEncoder { Quality = JpegQuality });
        return new PdfEmbeddedImage
        {
            JpegBytes = ms.ToArray(),
            Width = output.Width,
            Height = output.Height,
        };
    }

    private static bool IsLogoPixel(Rgba32 pixel)
    {
        if (pixel.A < 40)
        {
            return false;
        }

        var luminance = pixel.R * 0.299f + pixel.G * 0.587f + pixel.B * 0.114f;
        return luminance < 238;
    }

    public static PdfEmbeddedImage CreateWhiteVerticalSidebarCopy(
        PdfEmbeddedImage source,
        int targetDisplayWidth,
        int targetDisplayHeight,
        byte brandR,
        byte brandG,
        byte brandB)
    {
        var horizontal = CreateWhiteOnBrandCopy(
            source,
            targetDisplayHeight,
            targetDisplayWidth,
            brandR,
            brandG,
            brandB);

        using var image = Image.Load<Rgba32>(horizontal.JpegBytes);
        image.Mutate(ctx => ctx.Rotate(RotateMode.Rotate270));

        using var ms = new MemoryStream();
        image.SaveAsJpeg(ms, new JpegEncoder { Quality = JpegQuality });
        return new PdfEmbeddedImage
        {
            JpegBytes = ms.ToArray(),
            Width = image.Width,
            Height = image.Height,
        };
    }

    private static PdfEmbeddedImage LoadFromPath(string fullPath, int targetMaxWidth, int targetMaxHeight)
    {
        var extension = Path.GetExtension(fullPath).ToLowerInvariant();
        var imageInfo = Image.Identify(fullPath);
        if (imageInfo == null)
        {
            throw new InvalidOperationException("Unable to read logo image.");
        }

        var fitsWithoutResize = imageInfo.Width <= targetMaxWidth && imageInfo.Height <= targetMaxHeight;
        if (fitsWithoutResize && extension is ".jpg" or ".jpeg")
        {
            return new PdfEmbeddedImage
            {
                JpegBytes = File.ReadAllBytes(fullPath),
                Width = imageInfo.Width,
                Height = imageInfo.Height,
            };
        }

        using var image = Image.Load<Rgba32>(fullPath);
        var scale = Math.Min(1d, Math.Min(
            (double)targetMaxWidth / image.Width,
            (double)targetMaxHeight / image.Height));

        if (scale < 1d)
        {
            var newWidth = Math.Max(1, (int)Math.Round(image.Width * scale));
            var newHeight = Math.Max(1, (int)Math.Round(image.Height * scale));
            image.Mutate(ctx => ctx.Resize(new ResizeOptions
            {
                Size = new Size(newWidth, newHeight),
                Mode = ResizeMode.Stretch,
                Sampler = KnownResamplers.Lanczos3,
            }));
        }

        using var flattened = new Image<Rgba32>(image.Width, image.Height, Color.White);
        flattened.Mutate(ctx => ctx.DrawImage(image, new Point(0, 0), 1f));

        using var ms = new MemoryStream();
        flattened.SaveAsJpeg(ms, new JpegEncoder { Quality = JpegQuality });
        return new PdfEmbeddedImage
        {
            JpegBytes = ms.ToArray(),
            Width = flattened.Width,
            Height = flattened.Height,
        };
    }
}
