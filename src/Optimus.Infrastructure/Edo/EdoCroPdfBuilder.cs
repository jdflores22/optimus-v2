using System.Globalization;
using Optimus.Domain.Entities;
using Optimus.Domain.Enums;
using Optimus.Infrastructure.Storage;

namespace Optimus.Infrastructure.Edo;

internal static class EdoCroPdfBuilder
{
    internal static EdoCroPdfData Build(
        ElectronicDeliveryOrder edo,
        Manifest manifest,
        ShippingLine shippingLine,
        Container? container,
        User? preparedBy,
        User? authorizedBy,
        byte[] qrPng,
        string? logoDiskPath)
    {
        var issuedAt = edo.ReleasedAt ?? edo.GeneratedAt;
        var vesselVoyage = string.Join(" / ", new[] { manifest.VesselName, manifest.VoyageNumber }
            .Where(x => !string.IsNullOrWhiteSpace(x)));

        var consignee = manifest.Consignee?.BusinessName;
        if (string.IsNullOrWhiteSpace(consignee))
        {
            consignee = manifest.Consignee?.FullName;
        }

        var statusLabel = edo.Status switch
        {
            EdoStatus.Released => "RELEASED",
            EdoStatus.Active => "ACTIVE",
            EdoStatus.Expired => "EXPIRED",
            EdoStatus.PendingRelease => "PENDING RELEASE",
            EdoStatus.PendingValidation => "PENDING VALIDATION",
            EdoStatus.Rejected => "REJECTED",
            EdoStatus.Locked => "LOCKED",
            _ => edo.Status.ToString().ToUpperInvariant(),
        };

        var sizeLabel = container?.ContainerSize?.Name;
        if (!string.IsNullOrWhiteSpace(container?.ContainerSize?.Code))
        {
            sizeLabel = string.IsNullOrWhiteSpace(sizeLabel)
                ? container.ContainerSize.Code
                : $"{sizeLabel} ({container.ContainerSize.Code})";
        }

        var line = new EdoCroPdfLine
        {
            LineNo = 1,
            ContainerNumber = edo.ContainerNumber ?? container?.ContainerNumber ?? "—",
            Size = sizeLabel ?? "—",
            Type = container?.ContainerType?.Code ?? container?.ContainerType?.Name ?? "—",
            Seal = "SEALED",
            HaulerName = "—",
            PlateNo = "—",
            DemurrageValidUntil = edo.ExpiresAt?.ToString("dd-MMM-yyyy", CultureInfo.InvariantCulture) ?? "—",
            ReturnEmptyTo = edo.CyLocation ?? container?.CurrentLocation ?? "—",
        };

        var (isRenewed, renewedFrom) = ParseRenewedMeta(edo.AdditionalNotes);
        var portInstructions = isRenewed
            ? "Verify renewed release against the expired CRO/eDO reference above before accepting empty return."
            : string.IsNullOrWhiteSpace(edo.AdditionalNotes)
                ? "Present this CRO/eDO at the terminal gate for container release."
                : edo.AdditionalNotes!;

        return new EdoCroPdfData
        {
            LogoPath = logoDiskPath,
            ReferenceNo = edo.EdoNumber,
            Status = statusLabel,
            IsRenewed = isRenewed,
            RenewedFromEdoNumber = renewedFrom,
            ConsigneeNotifyParty = consignee ?? "—",
            ShippingLineCarrier = shippingLine.BrandName,
            RegistryNumber = manifest.ManifestNumber,
            CustomsOffice = "—",
            VesselVoyageNumber = string.IsNullOrWhiteSpace(vesselVoyage) ? "—" : vesselVoyage,
            BlNumber = manifest.BlNumber ?? "—",
            BrokerName = manifest.Broker?.FullName ?? "—",
            PortInstructions = portInstructions,
            EmptyReturnNote = string.IsNullOrWhiteSpace(edo.CyLocation)
                ? "Return empty container to the designated container yard before free time expires."
                : $"Return empty container to {edo.CyLocation}.",
            AuthorizedByName = authorizedBy?.FullName ?? preparedBy?.FullName,
            AuthorizedByCompany = shippingLine.BrandName,
            PreparedByName = preparedBy?.FullName,
            IssuedAtDisplay = issuedAt.ToString("dd-MMM-yyyy HH:mm", CultureInfo.InvariantCulture),
            QrPng = qrPng,
            Lines = new[] { line },
        };
    }

    internal static string? ResolveLogoPath(IUploadRootProvider uploads, ShippingLine shippingLine)
        => uploads.ResolveExistingFile(shippingLine.LogoPath);

    internal static (bool IsRenewed, string? RenewedFromEdoNumber) ParseRenewedMeta(string? notes)
    {
        if (string.IsNullOrWhiteSpace(notes))
        {
            return (false, null);
        }

        const string prefix = "Renewed from ";
        if (!notes.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return (false, null);
        }

        var firstLine = notes[prefix.Length..]
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault();
        return (true, string.IsNullOrWhiteSpace(firstLine) ? null : firstLine);
    }
}
