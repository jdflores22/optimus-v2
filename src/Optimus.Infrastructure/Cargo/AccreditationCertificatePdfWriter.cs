using System.Globalization;
using System.Text;
using Optimus.Application.Cargo.Dtos;

namespace Optimus.Infrastructure.Cargo;

/// <summary>
/// Renders SAS accreditation certificates in a formal registration-style layout,
/// branded to the issuing shipping line.
/// </summary>
internal static class AccreditationCertificatePdfWriter
{
    private const double PageWidth = 595;
    private const double PageHeight = 842;
    private const double SidePanelWidth = 131;
    private const double MainLeft = 148;
    private const double MainRight = 28;
    private const double MainWidth = PageWidth - MainLeft - MainRight;
    private const double MainCenterX = MainLeft + MainWidth / 2;
    private const double ContentInset = 12;
    private const double SafeTextWidth = MainWidth - ContentInset * 2;
    private const double MinTextLeft = MainLeft + ContentInset;
    private const double MaxTextRight = PageWidth - MainRight - ContentInset;

    private static readonly (double R, double G, double B) DefaultBrand = (0.090, 0.231, 0.384);
    private static readonly (double R, double G, double B) TextBrand = (0.090, 0.231, 0.384);
    private static readonly (double R, double G, double B) BodyMuted = (0.20, 0.20, 0.20);

    private const double ClosingAnchorY = 192;
    private const double DetailsAnchorY = 498;
    private const double HeaderLogoGap = 40;

    public static byte[] Build(AccreditationCertificatePdfRequest request, PdfEmbeddedImage? shippingLineLogo = null)
    {
        var brand = ParseColor(request.BrandColorHex, DefaultBrand);
        var canvas = new Canvas();
        var companyName = Sanitize(request.BusinessName ?? request.ApplicantName);
        var approved = request.ApprovedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var line = Sanitize(request.ShippingLineName);
        var role = Sanitize(request.RoleLabel);
        var address = Sanitize(request.BusinessAddress);
        var tin = Sanitize(request.Tin);
        var applicantName = Sanitize(request.ApplicantName);

        DrawSidePanel(canvas, brand);

        if (shippingLineLogo != null)
        {
            DrawSidePanelLogo(canvas, shippingLineLogo, brand);
        }

        var y = PageHeight - 14;
        if (shippingLineLogo != null)
        {
            y = DrawCenteredLogo(canvas, shippingLineLogo, MainCenterX, y, 300, 120, HeaderLogoGap);
        }
        else
        {
            y = PageHeight - 92;
        }

        y = DrawBlock(canvas, y, "Secured Accreditation System", "regular", 11, 14, 12, BodyMuted);

        var lineTitle = line.ToUpperInvariant();
        var lineFontSize = FitFontSize(lineTitle, "bold", SafeTextWidth, 17, 12);
        y = DrawBlock(canvas, y, lineTitle, "bold", lineFontSize, lineFontSize + 4, 16, TextBrand);

        var certTitle = "CERTIFICATE OF ACCREDITATION";
        var certFontSize = FitFontSize(certTitle, "bold", SafeTextWidth, 24, 18);
        y = DrawBlock(canvas, y, certTitle, "bold", certFontSize, certFontSize + 6, 26, TextBrand);

        y = DrawBlock(
            canvas,
            y,
            $"By issuance of this certificate, the accredited party agrees to maintain compliance with the Secured Accreditation System (SAS) requirements established by {line}, including periodic review and monitoring by the issuing shipping line.",
            "regular",
            10.5,
            13.5,
            0,
            BodyMuted);

        var detailsStartY = Math.Min(y - 36, DetailsAnchorY);
        DrawDetailsBlock(
            canvas,
            detailsStartY,
            request.SasIdNumber,
            approved,
            tin,
            companyName,
            address,
            role,
            applicantName);

        DrawBlock(
            canvas,
            ClosingAnchorY,
            "This is to certify that the information provided herein is true and correct. Further, agreement to the conditions from the approval of this Application as noted above is hereby affirmed.",
            "italic",
            10,
            13,
            0,
            BodyMuted);

        DrawFooterSection(canvas, request, line);

        return AssemblePdf(canvas);
    }

    private static double DrawDetailsBlock(
        Canvas canvas,
        double y,
        string sasId,
        string approved,
        string tin,
        string companyName,
        string address,
        string role,
        string applicantName)
    {
        const double labelWidth = 196;
        const double valueStart = 212;
        const double blockWidth = 400;
        const double blockLeft = MainCenterX - blockWidth / 2;
        const double valueWidth = blockWidth - valueStart;
        const double rowGap = 18;
        const double wrapLeading = 13.5;
        var nameLabel = string.Equals(role, "Broker", StringComparison.OrdinalIgnoreCase)
            ? "BROKER NAME"
            : "BUSINESS NAME";

        var rows = new List<(string Label, string Value, bool Wrap)>
        {
            ("SAS REG. NUMBER", Sanitize(sasId), false),
            ("REGISTRATION DATE", approved, false),
            ("EXPIRY DATE", "Valid while Approved", false),
            ("TIN", tin, false),
            (nameLabel, companyName, false),
            ("BUSINESS ADDRESS", address, true),
            ("ACCOUNT TYPE", role, false),
        };

        if (!string.Equals(applicantName, companyName, StringComparison.OrdinalIgnoreCase))
        {
            rows.Add(("AUTHORIZED REPRESENTATIVE", applicantName, false));
        }

        var cursorY = y;
        foreach (var (label, value, wrap) in rows)
        {
            canvas.Text(blockLeft, cursorY, label, "bold", 9.5, BodyMuted);
            canvas.Text(blockLeft + labelWidth, cursorY, ":", "regular", 9.5, BodyMuted);
            if (wrap)
            {
                cursorY = canvas.TextBlock(
                    blockLeft + valueStart,
                    cursorY,
                    valueWidth,
                    value,
                    "regular",
                    11,
                    wrapLeading,
                    TextBrand) - 2;
            }
            else
            {
                canvas.Text(blockLeft + valueStart, cursorY, Truncate(value, 46), "regular", 11, TextBrand);
                cursorY -= rowGap;
            }
        }

        return cursorY - 10;
    }

    private static void DrawFooterSection(
        Canvas canvas,
        AccreditationCertificatePdfRequest request,
        string shippingLine)
    {
        DrawQrPlaceholder(canvas, MainLeft + 16, 52, request.VerificationCode);

        const double sigWidth = 210;
        var sigRight = PageWidth - MainRight - 12;
        var sigLeft = sigRight - sigWidth;
        var sigCenter = sigLeft + sigWidth / 2;

        canvas.Line(sigLeft, 78, sigRight, 78);
        canvas.TextCenter(sigCenter, 64, "AUTHORIZED SIGNATORY", "bold", 8.5, BodyMuted);
        canvas.TextCenter(sigCenter, 52, Truncate(shippingLine.ToUpperInvariant(), 32), "regular", 7.5, BodyMuted);
    }

    private static double DrawBlock(
        Canvas canvas,
        double y,
        string text,
        string style,
        double size,
        double leading,
        double gapAfter,
        (double R, double G, double B) color)
    {
        var bottomY = canvas.TextBlockCentered(MainCenterX, y, SafeTextWidth, text, style, size, leading, color, MinTextLeft, MaxTextRight);
        return bottomY - gapAfter;
    }

    private static double FitFontSize(string text, string style, double maxWidth, double preferred, double minimum)
    {
        var factor = TextWidthFactor(style);
        for (var size = preferred; size >= minimum; size -= 0.5)
        {
            if (EstimateTextWidth(text, size, factor) <= maxWidth)
            {
                return size;
            }
        }

        return minimum;
    }

    private static double TextWidthFactor(string style) => style switch
    {
        "bold" => 0.56,
        "italic" => 0.50,
        _ => 0.48,
    };

    private static double EstimateTextWidth(string text, double size, string style)
        => EstimateTextWidth(text, size, TextWidthFactor(style));

    private static double EstimateTextWidth(string text, double size, double factor)
        => text.Length * size * factor;

    private static void DrawSidePanel(Canvas canvas, (double R, double G, double B) brand)
    {
        canvas.FillPolygon(
            new (double X, double Y)[]
            {
                (0, PageHeight),
                (SidePanelWidth * 0.7, PageHeight),
                (SidePanelWidth, 0),
                (0, 0),
            },
            brand.R, brand.G, brand.B);
    }

    private static void DrawSidePanelLogo(
        Canvas canvas,
        PdfEmbeddedImage logo,
        (double R, double G, double B) brand)
    {
        const double maxWidth = 78;
        const double maxHeight = 320;
        const double bottomMargin = 34;

        var whiteLogo = AccreditationCertificateLogoLoader.CreateWhiteVerticalSidebarCopy(
            logo,
            (int)Math.Ceiling(maxWidth * EmbedPixelsPerPoint),
            (int)Math.Ceiling(maxHeight * EmbedPixelsPerPoint),
            (byte)Math.Round(brand.R * 255),
            (byte)Math.Round(brand.G * 255),
            (byte)Math.Round(brand.B * 255));

        var scale = Math.Min(maxWidth / whiteLogo.Width, maxHeight / whiteLogo.Height);
        var drawWidth = whiteLogo.Width * scale;
        var drawHeight = whiteLogo.Height * scale;
        var centerX = SidePanelCenterX(bottomMargin + drawHeight / 2);
        var x = centerX - drawWidth / 2;
        var y = bottomMargin;

        var name = canvas.RegisterImage(whiteLogo);
        canvas.DrawImage(name, x, y, drawWidth, drawHeight);
    }

    private static double SidePanelCenterX(double y)
    {
        var clampedY = Math.Clamp(y, 0, PageHeight);
        var t = clampedY / PageHeight;
        var rightEdge = SidePanelWidth + t * (SidePanelWidth * 0.7 - SidePanelWidth);
        return rightEdge / 2;
    }

    private const double EmbedPixelsPerPoint = 2.5;

    private static double DrawCenteredLogo(
        Canvas canvas,
        PdfEmbeddedImage logo,
        double centerX,
        double topY,
        double maxWidth,
        double maxHeight,
        double gapAfter)
    {
        var scale = Math.Min(maxWidth / logo.Width, maxHeight / logo.Height);
        var drawWidth = logo.Width * scale;
        var drawHeight = logo.Height * scale;
        var x = centerX - drawWidth / 2;
        var y = topY - drawHeight;
        var name = canvas.RegisterImage(logo);
        canvas.DrawImage(name, x, y, drawWidth, drawHeight);
        return y - gapAfter;
    }

    private static void DrawQrPlaceholder(Canvas canvas, double x, double y, string code)
    {
        const double size = 62;
        canvas.StrokeDashedRect(x, y, size, size, 0.13, 0.13, 0.13, 1.2, 4, 3);
        canvas.TextCenter(x + size / 2, y + size / 2 + 6, "VERIFY", "bold", 8, BodyMuted);
        canvas.TextCenter(x + size / 2, y + size / 2 - 8, Truncate(code, 8), "regular", 6.5, BodyMuted);
    }

    private static (double R, double G, double B) ParseColor(string? hex, (double R, double G, double B) fallback)
    {
        if (string.IsNullOrWhiteSpace(hex)) return fallback;
        var value = hex.Trim().TrimStart('#');
        if (value.Length != 6 || !int.TryParse(value, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var rgb))
        {
            return fallback;
        }

        return ((rgb >> 16 & 0xFF) / 255d, (rgb >> 8 & 0xFF) / 255d, (rgb & 0xFF) / 255d);
    }

    private static string Sanitize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "N/A";
        var cleaned = new StringBuilder(value.Length);
        foreach (var ch in value.Replace('\r', ' ').Replace('\n', ' '))
        {
            cleaned.Append(ch switch
            {
                >= (char)32 and <= (char)126 => ch,
                '\u00F1' or '\u00D1' => ch,
                '\u2013' or '\u2014' => '-',
                _ => ' ',
            });
        }

        return CollapseWhitespace(cleaned.ToString());
    }

    private static string CollapseWhitespace(string value)
    {
        var parts = value.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length == 0 ? "N/A" : string.Join(' ', parts);
    }

    private static string Truncate(string value, int max)
    {
        var sanitized = Sanitize(value);
        return sanitized.Length <= max ? sanitized : sanitized[..max];
    }

    private static IEnumerable<string> WrapLines(string text, double maxWidth, double size)
    {
        var maxChars = Math.Max(12, (int)(maxWidth / (size * 0.48)));
        var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0)
        {
            yield return "";
            yield break;
        }

        var line = words[0];
        for (var i = 1; i < words.Length; i++)
        {
            var candidate = $"{line} {words[i]}";
            if (candidate.Length > maxChars)
            {
                yield return line;
                line = words[i];
            }
            else
            {
                line = candidate;
            }
        }

        yield return line;
    }

    private static byte[] AssemblePdf(Canvas canvas)
    {
        var stream = canvas.ToString();
        var streamBytes = Encoding.ASCII.GetBytes(stream);
        var images = canvas.Images;

        using var ms = new MemoryStream();
        var offsets = new List<long> { 0 };

        void WriteAscii(string text)
        {
            ms.Write(Encoding.ASCII.GetBytes(text));
        }

        void WriteObject(string text)
        {
            offsets.Add(ms.Position);
            WriteAscii(text);
        }

        WriteAscii("%PDF-1.4\n");

        WriteObject("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
        WriteObject("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");

        var xObjectResources = images.Count == 0
            ? ""
            : " /XObject<<" + string.Join(" ", images.Select(i => $"/{i.Name} {i.ObjectId} 0 R")) + " >>";
        WriteObject(
            $"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {Fmt(PageWidth)} {Fmt(PageHeight)}] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R /F2 6 0 R /F3 7 0 R >>{xObjectResources} >> >>endobj\n");

        offsets.Add(ms.Position);
        WriteAscii($"4 0 obj<< /Length {streamBytes.Length} >>stream\n");
        ms.Write(streamBytes);
        WriteAscii("endstream\nendobj\n");

        WriteObject("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n");
        WriteObject("6 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>endobj\n");
        WriteObject("7 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>endobj\n");

        foreach (var image in images)
        {
            offsets.Add(ms.Position);
            WriteAscii(
                $"{image.ObjectId} 0 obj<< /Type /XObject /Subtype /Image /Width {image.Width} /Height {image.Height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length {image.JpegBytes.Length} >>stream\n");
            ms.Write(image.JpegBytes);
            WriteAscii("\nendstream\nendobj\n");
        }

        var xrefPos = ms.Position;
        var objectCount = offsets.Count;
        WriteAscii($"xref\n0 {objectCount}\n");
        WriteAscii("0000000000 65535 f \n");
        for (var i = 1; i < offsets.Count; i++)
        {
            WriteAscii($"{offsets[i]:D10} 00000 n \n");
        }

        WriteAscii($"trailer<< /Size {objectCount} /Root 1 0 R >>\n");
        WriteAscii("startxref\n");
        WriteAscii(xrefPos.ToString(CultureInfo.InvariantCulture));
        WriteAscii("\n%%EOF\n");
        return ms.ToArray();
    }

    private static string Fmt(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);

    private sealed class Canvas
    {
        private readonly StringBuilder _content = new();
        private readonly Stack<string> _graphicsStates = new();
        private readonly List<EmbeddedImage> _images = new();

        public IReadOnlyList<EmbeddedImage> Images => _images;

        public string RegisterImage(PdfEmbeddedImage image)
        {
            var index = _images.Count + 1;
            var entry = new EmbeddedImage
            {
                Name = $"Im{index}",
                ObjectId = 7 + index,
                JpegBytes = image.JpegBytes,
                Width = image.Width,
                Height = image.Height,
            };
            _images.Add(entry);
            return entry.Name;
        }

        public void DrawImage(string name, double x, double y, double width, double height)
        {
            _content.AppendLine("q");
            _content.AppendLine($"{Fmt(width)} 0 0 {Fmt(height)} {Fmt(x)} {Fmt(y)} cm");
            _content.AppendLine($"/{name} Do");
            _content.AppendLine("Q");
        }

        public void Save()
        {
            _content.AppendLine("q");
            _graphicsStates.Push("q");
        }

        public void Restore()
        {
            if (_graphicsStates.Count > 0)
            {
                _graphicsStates.Pop();
            }

            _content.AppendLine("Q");
        }

        public void Transform(double a, double b, double c, double d, double e, double f)
        {
            _content.AppendLine($"{Fmt(a)} {Fmt(b)} {Fmt(c)} {Fmt(d)} {Fmt(e)} {Fmt(f)} cm");
        }

        public void FillPolygon(IReadOnlyList<(double X, double Y)> points, double r, double g, double b)
        {
            if (points.Count < 3) return;

            _content.AppendLine($"{Fmt(r)} {Fmt(g)} {Fmt(b)} rg");
            _content.AppendLine($"{Fmt(points[0].X)} {Fmt(points[0].Y)} m");
            for (var i = 1; i < points.Count; i++)
            {
                _content.AppendLine($"{Fmt(points[i].X)} {Fmt(points[i].Y)} l");
            }

            _content.AppendLine("h f");
        }

        public double TextBlock(
            double x,
            double topY,
            double maxWidth,
            string text,
            string style,
            double size,
            double leading,
            (double R, double G, double B) color)
        {
            var lines = WrapLines(text, maxWidth, size, style).ToList();
            if (lines.Count == 0) return topY;

            var y = topY;
            foreach (var line in lines)
            {
                Text(x, y, line, style, size, color);
                y -= leading;
            }

            return y;
        }

        public void StrokeDashedRect(
            double x,
            double y,
            double width,
            double height,
            double r,
            double g,
            double b,
            double lineWidth,
            double dashOn,
            double dashOff)
        {
            _content.AppendLine($"[{Fmt(dashOn)} {Fmt(dashOff)}] 0 d");
            _content.AppendLine($"{Fmt(lineWidth)} w");
            _content.AppendLine($"{Fmt(r)} {Fmt(g)} {Fmt(b)} RG");
            _content.AppendLine($"{Fmt(x)} {Fmt(y)} {Fmt(width)} {Fmt(height)} re S");
            _content.AppendLine("[] 0 d");
        }

        public void Line(double x1, double y1, double x2, double y2)
        {
            _content.AppendLine("0.13 0.13 0.13 RG");
            _content.AppendLine("0.8 w");
            _content.AppendLine($"{Fmt(x1)} {Fmt(y1)} m {Fmt(x2)} {Fmt(y2)} l S");
        }

        public void Text(double x, double y, string text, string style, double size, (double R, double G, double B) color)
            => Text(x, y, text, style, size, color.R, color.G, color.B);

        public void Text(double x, double y, string text, string style, double size, double r = 0, double g = 0, double b = 0)
        {
            _content.AppendLine("BT");
            _content.AppendLine($"{Font(style)} {Fmt(size)} Tf");
            _content.AppendLine($"{Fmt(r)} {Fmt(g)} {Fmt(b)} rg");
            _content.AppendLine($"{Fmt(x)} {Fmt(y)} Td");
            _content.AppendLine($"{PdfString(text)} Tj");
            _content.AppendLine("ET");
        }

        public void TextCenter(double centerX, double y, string text, string style, double size, (double R, double G, double B) color)
            => TextCenter(centerX, y, text, style, size, color.R, color.G, color.B);

        public void TextCenter(double centerX, double y, string text, string style, double size, double r = 0, double g = 0, double b = 0)
        {
            var factor = TextWidthFactor(style);
            var width = EstimateTextWidth(text, size, factor);
            var left = centerX - width / 2;
            left = Math.Max(MinTextLeft, Math.Min(left, MaxTextRight - width));
            Text(left, y, text, style, size, r, g, b);
        }

        public double TextBlockCentered(
            double centerX,
            double topY,
            double maxWidth,
            string text,
            string style,
            double size,
            double leading,
            (double R, double G, double B) color,
            double minLeft = 0,
            double maxRight = 0)
        {
            var lines = WrapLines(text, maxWidth, size, style).ToList();
            if (lines.Count == 0) return topY;

            var rightBound = maxRight > 0 ? maxRight : centerX + maxWidth / 2;
            var factor = TextWidthFactor(style);
            var y = topY;
            foreach (var line in lines)
            {
                var lineWidth = EstimateTextWidth(line, size, factor);
                var left = centerX - lineWidth / 2;
                if (left < minLeft)
                {
                    left = minLeft;
                }

                var maxLeft = rightBound - lineWidth;
                if (left > maxLeft)
                {
                    left = Math.Max(minLeft, maxLeft);
                }

                Text(left, y, line, style, size, color);
                y -= leading;
            }

            return y;
        }

        public override string ToString() => _content.ToString();

        private static string Font(string style) => style switch
        {
            "bold" => "/F2",
            "italic" => "/F3",
            _ => "/F1",
        };

        private static double TextWidthFactor(string style) => style switch
        {
            "bold" => 0.56,
            "italic" => 0.50,
            _ => 0.48,
        };

        private static double EstimateTextWidth(string text, double size, double factor)
            => text.Length * size * factor;

        private static IEnumerable<string> WrapLines(string text, double maxWidth, double size, string style)
        {
            var factor = TextWidthFactor(style);
            var maxChars = Math.Max(12, (int)(maxWidth / (size * factor)));
            var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (words.Length == 0)
            {
                yield return "";
                yield break;
            }

            var line = words[0];
            for (var i = 1; i < words.Length; i++)
            {
                var candidate = $"{line} {words[i]}";
                if (candidate.Length > maxChars)
                {
                    yield return line;
                    line = words[i];
                }
                else
                {
                    line = candidate;
                }
            }

            yield return line;
        }

        private static string PdfString(string value)
        {
            var escaped = value
                .Replace("\\", "\\\\")
                .Replace("(", "\\(")
                .Replace(")", "\\)")
                .Replace("\t", " ");
            var cleaned = new StringBuilder(escaped.Length);
            foreach (var ch in escaped)
            {
                cleaned.Append(ch switch
                {
                    >= (char)32 and <= (char)126 => ch,
                    '\u00F1' => 'n',
                    '\u00D1' => 'N',
                    _ => ' ',
                });
            }

            return $"({CollapseWhitespace(cleaned.ToString())})";
        }

        private static string Fmt(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);
    }

    private sealed class EmbeddedImage
    {
        public required string Name { get; init; }
        public required int ObjectId { get; init; }
        public required byte[] JpegBytes { get; init; }
        public required int Width { get; init; }
        public required int Height { get; init; }
    }
}
