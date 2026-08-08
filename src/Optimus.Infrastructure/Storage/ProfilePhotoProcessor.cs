using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace Optimus.Infrastructure.Storage;

public static class ProfilePhotoProcessor
{
    public static async Task SaveAsync(Stream input, string outputPath, string extension, CancellationToken cancellationToken = default)
    {
        if (!IsPng(extension))
        {
            await using var output = File.Create(outputPath);
            await input.CopyToAsync(output, cancellationToken);
            return;
        }

        using var image = await Image.LoadAsync<Rgba32>(input, cancellationToken);
        using var flattened = new Image<Rgba32>(image.Width, image.Height, Color.White);
        flattened.Mutate(ctx => ctx.DrawImage(image, new Point(0, 0), 1f));

        await using var pngOutput = File.Create(outputPath);
        await flattened.SaveAsync(pngOutput, new PngEncoder(), cancellationToken);
    }

    public static bool IsPng(string extension) =>
        extension.Equals(".png", StringComparison.OrdinalIgnoreCase);
}
