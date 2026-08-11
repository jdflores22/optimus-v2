using Optimus.Application.Yard.Dtos;

namespace Optimus.Application.Yard.Interfaces;

public interface ITerminalService
{
    Task<TerminalDto> UpsertAsync(Guid? id, UpsertTerminalRequest request, Guid actorId, CancellationToken ct = default);
    Task<IReadOnlyList<TerminalDto>> ListAsync(bool? activeOnly = true, CancellationToken ct = default);
    Task<TerminalDetailDto> GetDetailAsync(Guid id, CancellationToken ct = default);
    Task<TerminalDto> ToggleStatusAsync(Guid id, Guid actorId, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid actorId, CancellationToken ct = default);
    Task<TerminalDto> UploadLogoAsync(Guid id, string relativePath, Guid actorId, CancellationToken ct = default);
    Task<TerminalSlotDto> UpsertSlotAsync(UpsertSlotRequest request, Guid actorId, CancellationToken ct = default);
    Task<IReadOnlyList<TerminalSlotDto>> ListSlotsAsync(Guid terminalId, DateOnly? from, DateOnly? to, CancellationToken ct = default);
}

public interface IContainerCatalogService
{
    Task<ContainerTypeDto> UpsertTypeAsync(Guid? id, UpsertContainerTypeRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ContainerTypeDto>> ListTypesAsync(CancellationToken ct = default);
    Task<ContainerSizeDto> UpsertSizeAsync(Guid? id, UpsertContainerSizeRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ContainerSizeDto>> ListSizesAsync(CancellationToken ct = default);
}

public interface ICyAllocationService
{
    Task<CyAllocationDto> UpsertAsync(Guid? id, UpsertCyAllocationRequest request, Guid actorId, CancellationToken ct = default);
    Task<IReadOnlyList<CyAllocationDto>> ListAsync(
        Guid? shippingLineId,
        Guid? terminalId,
        bool activeTerminalsOnly = true,
        bool containerYardsOnly = true,
        CancellationToken ct = default);
}

public interface IContainerInventoryService
{
    Task<ContainerDto> CreateAsync(CreateContainerRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<ContainerDto> GetAsync(Guid id, CancellationToken ct = default);
    Task EnsureAccessAsync(Guid containerId, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<ContainerInventoryItemDto> GetInventoryItemAsync(Guid id, CancellationToken ct = default);
    Task<ContainerDetailDto> GetDetailByNumberAsync(string containerNumber, Guid? shippingLineId, CancellationToken ct = default);
    Task<IReadOnlyList<ContainerDto>> ListAsync(Guid? shippingLineId, string? status, string? search, CancellationToken ct = default);
    Task<ContainerInventoryPageDto> InventoryPageAsync(
        Guid? shippingLineId,
        string? depot,
        string? search,
        int page,
        int pageSize,
        string? terminalIdentity = null,
        IReadOnlyList<Guid>? terminalIds = null,
        CancellationToken ct = default);
    Task<IReadOnlyList<string>> ListInventoryDepotsAsync(
        Guid? shippingLineId,
        string? terminalIdentity = null,
        IReadOnlyList<Guid>? terminalIds = null,
        CancellationToken ct = default);
    Task<IReadOnlyList<ContainerDto>> SearchForReturnAsync(string query, CancellationToken ct = default);
    Task<ContainerDto> AllocateAsync(Guid id, AllocateContainerRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<ContainerDto> ReallocateAsync(Guid id, ReallocateContainerRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<ContainerDto> LockAllocationAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<ContainerDto> UpdateStackAsync(Guid id, UpdateStackRequest request, Guid actorId, CancellationToken ct = default);
    Task<ContainerDto> MarkAvailableForReturnAsync(Guid id, Guid actorId, CancellationToken ct = default);
    Task<(string Csv, string PdfPath)> ExportUtilizationAsync(
        string? terminalIdentity = null,
        Guid? shippingLineId = null,
        CancellationToken ct = default);
    Task<IReadOnlyList<UtilizationReportDto>> UtilizationReportAsync(
        string? terminalIdentity = null,
        Guid? shippingLineId = null,
        CancellationToken ct = default);
    Task<ContainerInventoryPageDto> PreForecastPageAsync(
        string? search,
        int page,
        int pageSize,
        IReadOnlyList<Guid> terminalIds,
        CancellationToken ct = default);
}

public interface IDwellService
{
    Task<DwellConfigDto> GetConfigAsync(CancellationToken ct = default);
    Task<DwellConfigDto> UpsertConfigAsync(UpsertDwellConfigRequest request, Guid actorId, CancellationToken ct = default);
    Task<ContainerDto> RecordArrivalAsync(Guid containerId, DateTime? arrivalAt, Guid actorId, CancellationToken ct = default);
    Task<ContainerDto> PauseAsync(Guid containerId, PauseResumeDwellRequest request, Guid actorId, CancellationToken ct = default);
    Task<ContainerDto> ResumeAsync(Guid containerId, PauseResumeDwellRequest request, Guid actorId, CancellationToken ct = default);
    Task<IReadOnlyList<DwellEventDto>> ListEventsAsync(Guid? containerId, CancellationToken ct = default);
    Task<IReadOnlyList<ContainerDto>> MonitorListAsync(CancellationToken ct = default);
    Task<int> ProcessMonitoringAsync(CancellationToken ct = default);
}

public interface IPreForecastService
{
    Task<PreForecastDto> SubmitAsync(SubmitPreForecastRequest request, string? photoPath, Guid truckerId, CancellationToken ct = default);
    Task<PreForecastDto> VerifyAsync(Guid id, VerifyPreForecastRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<PreForecastDto> CompleteAsync(Guid id, CompletePreForecastRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<PreForecastDto> CancelAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<PreForecastDto> GetAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<PreForecastDto>> ListAsync(string? status, Guid? truckerId, CancellationToken ct = default);
}

public interface ITruckerTokenService
{
    Task<TruckerTokenDto> GenerateAsync(Guid truckerId, CancellationToken ct = default);
    Task<TruckerTokenDto> RefreshAsync(Guid truckerId, CancellationToken ct = default);
    Task RevokeAsync(Guid truckerId, CancellationToken ct = default);
    Task<bool> ValidateAsync(Guid truckerId, string rawToken, CancellationToken ct = default);
}

public interface ITruckerPreForecastService
{
    Task<IReadOnlyList<TruckerPreForecastSearchResultDto>> SearchAsync(string query, CancellationToken ct = default);

    Task<TruckerPreForecastVerifyDto> VerifyByTokenAsync(string token, CancellationToken ct = default);

    Task<TruckerPreForecastSubmissionDto> SubmitAsync(
        string verificationToken,
        DateTime returnDate,
        string releaseDocumentPath,
        IReadOnlyList<TruckerPreForecastPhotoInput> photos,
        Guid truckerId,
        Guid? preferredTerminalId = null,
        CancellationToken ct = default);

    Task<IReadOnlyList<TruckerPreForecastSubmissionDto>> ListAsync(string? status, Guid actorId, string actorRole, CancellationToken ct = default);

    Task<TruckerPreForecastSubmissionDto> GetAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct = default);

    Task<TruckerPreForecastSubmissionDto> AssignTerminalAsync(
        Guid id,
        AssignTruckerPreForecastTerminalRequest request,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default);

    Task<TruckerPreForecastSubmissionDto> ConfirmCyScheduleAsync(
        Guid id,
        ConfirmCyPreForecastScheduleRequest request,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default);

    Task<TruckerPreForecastSubmissionDto> FinalizeAccountingAsync(
        Guid id,
        FinalizePreForecastAccountingRequest request,
        Guid actorId,
        string actorRole,
        CancellationToken ct = default);

    Task MarkCompletedWhenEdoPaidAsync(Guid edoId, CancellationToken ct = default);
}

public interface INotificationService
{
    Task NotifyAsync(Guid? userId, string title, string message, string category, string? subjectType, Guid? subjectId, CancellationToken ct = default);
    Task<IReadOnlyList<NotificationDto>> ListForUserAsync(Guid userId, CancellationToken ct = default);
    Task<NotificationDto?> GetForUserAsync(Guid userId, Guid notificationId, CancellationToken ct = default);
    Task MarkReadAsync(Guid userId, Guid? notificationId, CancellationToken ct = default);
    Task<Optimus.Application.Platform.Dtos.NotificationPreferenceDto> GetPreferencesAsync(Guid userId, CancellationToken ct = default);
    Task<Optimus.Application.Platform.Dtos.NotificationPreferenceDto> UpsertPreferencesAsync(Guid userId, Optimus.Application.Platform.Dtos.UpsertNotificationPreferenceRequest request, CancellationToken ct = default);
    Task SubscribePushAsync(Guid userId, Optimus.Application.Platform.Dtos.PushSubscribeRequest request, CancellationToken ct = default);
    Task UnsubscribePushAsync(Guid userId, string endpoint, CancellationToken ct = default);
    Task<Optimus.Application.Platform.Dtos.NotificationMetricsDto> GetMetricsAsync(CancellationToken ct = default);
}
