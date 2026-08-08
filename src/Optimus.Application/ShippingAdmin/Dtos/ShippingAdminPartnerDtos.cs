namespace Optimus.Application.ShippingAdmin.Dtos;

public record LinkedPartyDto(Guid Id, string Name, string Email);

public record ShippingAdminConsigneeDto(
    Guid Id,
    string BusinessName,
    string FullName,
    string Email,
    string Status,
    bool IsActive,
    int BrokerCount,
    int NoaCount,
    int ManifestCount,
    int ContainerCount,
    IReadOnlyList<LinkedPartyDto> LinkedBrokers);

public record ShippingAdminBrokerDto(
    Guid Id,
    string FullName,
    string Email,
    string Status,
    bool IsActive,
    int ConsigneeCount,
    int ManifestCount,
    int EdoCount,
    IReadOnlyList<LinkedPartyDto> LinkedConsignees);

public record ShippingAdminConsigneeDetailDto(
    ShippingAdminConsigneeDto Consignee,
    int EdoCount,
    IReadOnlyList<PartnerNoaListItemDto> Noas,
    IReadOnlyList<PartnerManifestListItemDto> Manifests,
    IReadOnlyList<PartnerContainerListItemDto> Containers,
    IReadOnlyList<PartnerEdoListItemDto> Edos,
    PartnerAccreditationDto? Accreditation);

public record ShippingAdminBrokerDetailDto(
    ShippingAdminBrokerDto Broker,
    int ContainerCount,
    IReadOnlyList<PartnerManifestListItemDto> Manifests,
    IReadOnlyList<PartnerContainerListItemDto> Containers,
    IReadOnlyList<PartnerEdoListItemDto> Edos,
    PartnerAccreditationDto? Accreditation);

public record PartnerAccreditationDto(
    Guid Id,
    Guid FormConfigurationId,
    string FormName,
    string FormType,
    int FormVersion,
    string FieldsJson,
    string SubmittedDataJson,
    string Status,
    DateTime SubmittedAt,
    DateTime? ApprovedAt,
    DateTime? EvaluatedAt,
    string? SasIdNumber,
    string? CertificatePdfPath);

public record RecentManifestDto(
    Guid Id,
    string ManifestNumber,
    string WorkflowState,
    DateTime CreatedAt);

public record PartnerNoaListItemDto(
    Guid Id,
    string NoaNumber,
    Guid ManifestId,
    string ManifestNumber,
    string? VesselName,
    DateTime? Eta,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record PartnerManifestListItemDto(
    Guid Id,
    string ManifestNumber,
    string WorkflowState,
    string? NoaNumber,
    string? BlNumber,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    int EdoTotalCount,
    int EdoReleasedCount);

public record PartnerContainerListItemDto(
    Guid Id,
    string ContainerNumber,
    Guid? ManifestId,
    string? ManifestNumber,
    string? TypeCode,
    string? SizeCode,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record PartnerEdoListItemDto(
    Guid Id,
    string EdoNumber,
    Guid ManifestId,
    string ManifestNumber,
    string? ContainerNumber,
    string Status,
    DateTime GeneratedAt,
    DateTime? UpdatedAt);
