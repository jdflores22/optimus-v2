namespace Optimus.Infrastructure.Cargo;

internal sealed class PdfEmbeddedImage
{
    public required byte[] JpegBytes { get; init; }
    public required int Width { get; init; }
    public required int Height { get; init; }
}
