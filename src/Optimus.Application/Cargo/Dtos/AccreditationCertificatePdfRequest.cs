namespace Optimus.Application.Cargo.Dtos;

public record AccreditationCertificatePdfRequest(
    string ShippingLineName,
    string? ShippingLineLogoPath,
    string? BrandColorHex,
    string SasIdNumber,
    string ApplicantName,
    string RoleLabel,
    string FormName,
    int FormVersion,
    DateTime ApprovedAt,
    DateTime SubmittedAt,
    string? BusinessName,
    string? Tin,
    string? BusinessAddress,
    string VerificationCode);
