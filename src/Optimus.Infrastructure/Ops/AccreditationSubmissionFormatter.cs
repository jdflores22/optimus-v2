using System.Text.Json;

namespace Optimus.Infrastructure.Ops;

internal static class AccreditationSubmissionFormatter
{
    public static string? ExtractField(string submittedDataJson, params string[] keys)
    {
        if (string.IsNullOrWhiteSpace(submittedDataJson)) return null;

        try
        {
            using var doc = JsonDocument.Parse(submittedDataJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return null;

            foreach (var key in keys)
            {
                if (!doc.RootElement.TryGetProperty(key, out var value)) continue;

                var formatted = FormatValue(value);
                if (!string.IsNullOrWhiteSpace(formatted)) return formatted.Trim();
            }
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }

    public static string? ExtractBusinessOrBrokerName(string submittedDataJson, string roleLabel)
    {
        var direct = ExtractField(
            submittedDataJson,
            "company",
            "business_name",
            "businessName",
            "broker_name",
            "brokerName");

        if (!string.IsNullOrWhiteSpace(direct))
        {
            return direct;
        }

        if (!string.Equals(roleLabel, "Broker", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return ExtractPersonName(submittedDataJson);
    }

    private static string? ExtractPersonName(string submittedDataJson)
    {
        var parts = new[]
        {
            ExtractField(submittedDataJson, "firstname", "first_name", "firstName"),
            ExtractField(submittedDataJson, "middlename", "middle_name", "middleName"),
            ExtractField(submittedDataJson, "lastname", "last_name", "lastName"),
        }.Where(static part => !string.IsNullOrWhiteSpace(part)).ToList();

        return parts.Count == 0 ? null : string.Join(' ', parts);
    }

    private static string? FormatValue(JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.String:
            {
                var text = value.GetString()?.Trim();
                if (string.IsNullOrWhiteSpace(text)) return null;
                if (text.StartsWith('{') && text.EndsWith('}'))
                {
                    var address = TryFormatAddressJson(text);
                    if (address != null) return address;
                }

                return text;
            }
            case JsonValueKind.Number:
                return value.GetRawText();
            case JsonValueKind.True:
                return "Yes";
            case JsonValueKind.False:
                return "No";
            case JsonValueKind.Object:
                return TryFormatAddressElement(value);
            default:
                return null;
        }
    }

    private static string? TryFormatAddressJson(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            return TryFormatAddressElement(doc.RootElement);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string? TryFormatAddressElement(JsonElement obj)
    {
        if (obj.ValueKind != JsonValueKind.Object) return null;

        var parts = new[]
        {
            ReadProperty(obj, "street"),
            ReadProperty(obj, "barangay_name", "barangay"),
            ReadProperty(obj, "city_name", "city"),
            ReadProperty(obj, "province_name", "province"),
            ReadProperty(obj, "region_name", "region"),
        }.Where(static part => !string.IsNullOrWhiteSpace(part)).ToList();

        return parts.Count == 0 ? null : string.Join(", ", parts);
    }

    private static string? ReadProperty(JsonElement obj, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (!obj.TryGetProperty(key, out var value)) continue;
            if (value.ValueKind == JsonValueKind.String)
            {
                var text = value.GetString()?.Trim();
                if (!string.IsNullOrWhiteSpace(text)) return text;
            }
        }

        return null;
    }
}
