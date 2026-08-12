using Optimus.Application.Cargo.Dtos;
using Optimus.Domain.Enums;

namespace Optimus.Application.Yard.Dtos;

public record TerminalDto(
    Guid Id,
    string Name,
    string Code,
    string Identity,
    string Kind,
    string? Location,
    string? Region,
    string? City,
    int DailyCapacity,
    bool IsActive,
    string? LogoPath);

public record UpsertTerminalRequest(
    string Name,
    string Code,
    string Identity,
    string Kind,
    string? Location,
    string? Region,
    string? City,
    int DailyCapacity,
    bool IsActive = true);

public record TerminalAllocationRowDto(
    Guid Id,
    Guid ShippingLineId,
    string ShippingLineName,
    int AllocatedCapacityTeu,
    int Capacity20Ft,
    int Capacity40Ft,
    int UsedTeu,
    DateTime CreatedAt);

public record TerminalDetailDto(
    TerminalDto Terminal,
    int TotalAllocatedTeu,
    int AvailableCapacityTeu,
    decimal UtilizationPercent,
    IReadOnlyList<TerminalAllocationRowDto> Allocations);

public record TerminalSlotDto(
    Guid Id,
    Guid TerminalId,
    string TerminalName,
    DateOnly Date,
    int Capacity,
    int AssignedCount,
    string Status);

public record UpsertSlotRequest(Guid TerminalId, DateOnly Date, int Capacity);

public record ContainerTypeDto(Guid Id, string Name, string Code, string? Description, bool IsActive);
public record UpsertContainerTypeRequest(string Name, string Code, string? Description, bool IsActive = true);

public record ContainerSizeDto(Guid Id, string Name, string Code, decimal TeuValue, string? Description, bool IsActive);
public record UpsertContainerSizeRequest(string Name, string Code, decimal TeuValue, string? Description, bool IsActive = true);

public record CyAllocationDto(
    Guid Id,
    Guid ShippingLineId,
    string ShippingLineName,
    Guid TerminalId,
    string TerminalName,
    Guid? StaffUserId,
    int AllocatedCapacityTeu,
    int Capacity20Ft,
    int Capacity40Ft,
    int UsedTeu);

public record UpsertCyAllocationRequest(
    Guid ShippingLineId,
    Guid TerminalId,
    Guid? StaffUserId,
    int AllocatedCapacityTeu,
    int Capacity20Ft,
    int Capacity40Ft);

public record CyStaffScopeTerminalDto(Guid Id, string Name, string Code);

public record CyStaffScopeDto(bool HasAssignment, IReadOnlyList<CyStaffScopeTerminalDto> Terminals);

public record ContainerDto(
    Guid Id,
    string ContainerNumber,
    Guid ShippingLineId,
    string ShippingLineName,
    Guid? ManifestId,
    string? TypeCode,
    string? SizeCode,
    string Status,
    string AllocationStatus,
    string? CurrentLocation,
    Guid? CyAllocationId,
    string? CyTerminalName,
    int CurrentDwellDays,
    DateTime? TerminalArrivalDate,
    DateTime? DwellPausedAt,
    string? StackBay,
    string? StackRow,
    string? StackTier,
    DateTime CreatedAt);

public record CreateContainerRequest(
    string ContainerNumber,
    Guid ShippingLineId,
    Guid? ManifestId,
    Guid? ContainerTypeId,
    Guid? ContainerSizeId,
    string? CurrentLocation,
    string? StackBay,
    string? StackRow,
    string? StackTier);

public record AllocateContainerRequest(Guid CyAllocationId, string? Reason);
public record ReallocateContainerRequest(Guid NewCyAllocationId, string? Reason);
public record UpdateStackRequest(string? StackBay, string? StackRow, string? StackTier, string? CurrentLocation);

public record DwellConfigDto(
    Guid Id,
    int NotificationThresholdDays,
    int AutomaticReturnThresholdDays,
    string Timezone,
    bool EnableAutomaticReturns,
    bool EnableNotifications,
    bool IsActive);

public record UpsertDwellConfigRequest(
    int NotificationThresholdDays,
    int AutomaticReturnThresholdDays,
    string Timezone,
    bool EnableAutomaticReturns,
    bool EnableNotifications);

public record DwellEventDto(
    Guid Id,
    Guid ContainerId,
    string ContainerNumber,
    string EventType,
    DateTime EventDate,
    int DwellDaysAtEvent,
    string? Reason);

public record PauseResumeDwellRequest(string? Reason);

public record PreForecastDto(
    Guid Id,
    Guid ContainerId,
    string ContainerNumber,
    Guid TerminalId,
    string TerminalName,
    Guid TruckerId,
    string TruckerName,
    string Status,
    Guid? AssignedSlotId,
    string? PaymentReference,
    bool PaymentVerified,
    string? RejectionReason,
    string? QrCodePath,
    string? PackagePdfPath,
    string? EdoNumber,
    string? VerificationToken,
    DateTime CreatedAt,
    IReadOnlyList<GeotagPhotoDto> Photos);

public record GeotagPhotoDto(
    Guid Id,
    string FilePath,
    string? OriginalName,
    double? Latitude,
    double? Longitude,
    DateTime CapturedAt,
    bool IsVerified);

public record SubmitPreForecastRequest(
    Guid ContainerId,
    Guid TerminalId,
    Guid? SlotId,
    string? PaymentReference,
    double? Latitude,
    double? Longitude);

public record VerifyPreForecastRequest(bool Approve, Guid? SlotId, string? RejectionReason, string? Notes);
public record CompletePreForecastRequest(string? EdoNumber);

public record TruckerTokenDto(string ApiToken, DateTime ExpiresAt);
public record UtilizationReportDto(
    Guid TerminalId,
    string TerminalName,
    string TerminalIdentity,
    string? TerminalOperator,
    int AllocatedTeu,
    int UsedTeu,
    decimal UtilizationPercent,
    int AvailableForReturn,
    int AtTerminal,
    int PendingPreForecast);

public record ContainerInventoryItemDto(
    Guid Id,
    string ContainerNumber,
    Guid ShippingLineId,
    string ShippingLineName,
    string? TypeCode,
    string? SizeCode,
    string SizeTypeLabel,
    string DepotName,
    DateTime? GateInDate,
    int CurrentDwellDays,
    int TotalPausedDays,
    bool IsDwellPaused,
    string DisplayStatus,
    string Condition,
    string AllocationStatus,
    string Status,
    decimal TeuValue,
    string? StackBay,
    string? StackRow,
    string? StackTier,
    string? CurrentLocation,
    DateTime CreatedAt);

public record ContainerInventoryStatsDto(
    int TotalContainers,
    int TotalTeus,
    int Total20Ft,
    int Total40Ft,
    int OverallCapacityTeu,
    int OverallCapacity20Ft,
    int OverallCapacity40Ft,
    int TerminalCount,
    int TerminalCapacityTeu,
    int TerminalCapacity20Ft,
    int TerminalCapacity40Ft,
    int YardCount,
    int YardCapacityTeu,
    int YardCapacity20Ft,
    int YardCapacity40Ft);

public record ContainerInventoryPageDto(
    IReadOnlyList<ContainerInventoryItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages,
    string ShippingLineName,
    ContainerInventoryStatsDto Stats);

public record ContainerDetailBasicInfoDto(
    string ContainerNumber,
    string SizeType,
    decimal TeuCount,
    string Location,
    DateTime? GateInDate,
    int DwellTime,
    string Condition,
    string Status,
    string ShippingLineName,
    string? StackPosition,
    string? OperationalStatus);

public record ContainerDetailSpecificationsDto(
    string Manufacturer,
    string YearBuilt,
    string IsoCode,
    string CscPlate,
    string MaxGrossWeight,
    string TareWeight,
    string MaxPayload,
    string Length,
    string Width,
    string Height);

public record ContainerDetailMovementDto(
    string LastMovement,
    string MovementType,
    string FromLocation,
    string ToLocation,
    string Operator,
    string Equipment,
    string Remarks);

public record ContainerDetailDocumentationDto(
    string BillOfLading,
    string Manifest,
    string CustomsDeclaration,
    string? DeliveryOrder,
    string GatePass);

public record ContainerDetailChargesDto(
    decimal StorageCharges,
    decimal HandlingCharges,
    decimal DocumentationFee);

public record ContainerDetailHistoryItemDto(
    string Date,
    string Type,
    string FromLocation,
    string ToLocation,
    string Operator,
    string Equipment,
    string Remarks);

public record ContainerDetailInspectionDto(
    string Date,
    string Type,
    string Inspector,
    string Result,
    string Photos,
    string Remarks);

public record ContainerDetailDto(
    Guid Id,
    ContainerDetailBasicInfoDto BasicInfo,
    ContainerDetailSpecificationsDto Specifications,
    ContainerDetailMovementDto Movement,
    ContainerDetailDocumentationDto Documentation,
    ContainerDetailChargesDto Charges,
    IReadOnlyList<ContainerDetailHistoryItemDto> History,
    IReadOnlyList<ContainerDetailInspectionDto> Inspections);

public record NotificationDto(
    Guid Id,
    string Title,
    string Message,
    string Category,
    bool IsRead,
    DateTime CreatedAt,
    string? SubjectType = null,
    Guid? SubjectId = null);

public record TruckerPreForecastSearchResultDto(
    Guid ContainerId,
    string ContainerNumber,
    Guid? EdoId,
    string? EdoNumber,
    string? EdoStatus,
    DateTime? EdoExpiresAt,
    bool EdoExpired,
    int OverdueDays,
    decimal EstimatedDetention,
    Guid? ManifestId,
    string? BrokerName,
    string? ConsigneeName,
    Guid? BrokerId,
    Guid? ConsigneeId,
    string? ContainerSize = null,
    string? ContainerType = null,
    string? ContainerStatus = null,
    string? CyLocation = null,
    string? ManifestNumber = null,
    string? BlNumber = null,
    string? VesselName = null,
    string? VoyageNumber = null,
    string? ShippingLineName = null);

public record TruckerPreForecastVerifyDto(
    bool Valid,
    string Message,
    string? VerificationToken,
    TruckerPreForecastSearchResultDto? Match);

public record TruckerPreForecastPhotoInput(
    ContainerPhotoCategory Category,
    string FilePath,
    string? OriginalName,
    string? Comment);

public record TruckerPreForecastPhotoDto(
    Guid Id,
    string Category,
    string Label,
    string FilePath,
    string? OriginalName,
    string? Comment);

public record TruckerPreForecastSubmissionDto(
    Guid Id,
    Guid ContainerId,
    string ContainerNumber,
    string? SizeCode,
    Guid ExpiredEdoId,
    string ExpiredEdoNumber,
    Guid? RenewalRequestId,
    string Status,
    DateTime ReturnDate,
    decimal DetentionAmount,
    int OverdueDays,
    bool AwaitingDetentionPayment,
    string Message,
    IReadOnlyList<TruckerPreForecastPhotoDto> Photos,
    DateTime TruckerPreferredReturnDate,
    int ScheduleDeltaDays = 0,
    decimal DetentionAtPreferredDate = 0,
    decimal ExtraDaysDetentionAmount = 0,
    bool ExtraDaysWaived = false,
    Guid? PreferredTerminalId = null,
    string? PreferredTerminalName = null,
    Guid? AssignedTerminalId = null,
    string? AssignedTerminalName = null,
    Guid? AssignedSlotId = null,
    DateOnly? AssignedSlotDate = null,
    DateTime? CyConfirmedReturnDate = null,
    string? TerminalNotes = null,
    string? CyNotes = null,
    Guid? NewEdoId = null,
    string? NewEdoNumber = null,
    string? TruckerName = null,
    string? ShippingLineBrandName = null,
    bool EdoExpired = false,
    string? ManifestNumber = null,
    string? BrokerName = null,
    string? ConsigneeName = null,
    string? DetentionBillingPdfPath = null,
    decimal? DetentionBillingBaseAmount = null,
    decimal? DetentionBillingExtraAmount = null,
    DateTime? FreeTimeUntil = null,
    DateTime? ExpiredEdoExpiresAt = null,
    decimal DetentionRatePerDay = 150,
    decimal DetentionRateAtCalculation = 0,
    int OverdueDaysAtPreferred = 0,
    int OverdueDaysAtCyConfirmed = 0,
    bool DetentionPaymentReceiptSubmitted = false,
    string? DetentionPaymentReceiptPath = null,
    string? RenewalEdoStatus = null,
    string? RenewalEdoPaymentStatus = null);

public record AssignTruckerPreForecastTerminalRequest(
    Guid TerminalId,
    Guid? SlotId,
    string? Notes);

public record ConfirmCyPreForecastScheduleRequest(
    DateTime ConfirmedReturnDate,
    bool Approve,
    string? Notes);

public record FinalizePreForecastAccountingRequest(
    decimal? AdjustedDetentionAmount,
    bool? WaiveExtraDays,
    string? Notes,
    IReadOnlyList<BillingChargeLineDto>? ChargeLines = null);
