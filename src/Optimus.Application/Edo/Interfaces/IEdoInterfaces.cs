using Optimus.Application.Edo.Dtos;

namespace Optimus.Application.Edo.Interfaces;

public interface IEdoService
{
    Task<EdoDto> GenerateAsync(GenerateEdoRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<GenerationSessionDto> BatchGenerateAsync(BatchGenerateEdoRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<GenerationSessionDto?> GetSessionAsync(Guid sessionId, CancellationToken ct = default);
    Task<EdoDto> GetAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<EdoDto>> ListAsync(Guid? manifestId, string? status, Guid actorId, string actorRole, Guid? brokerId = null, Guid? consigneeId = null, CancellationToken ct = default);
    Task<EdoReleaseQueueDto> ListReleaseQueueAsync(Guid? shippingLineId = null, CancellationToken ct = default);
    Task<IReadOnlyList<EdoReleaseRecordDto>> ListReleaseRecordsAsync(Guid? shippingLineId = null, CancellationToken ct = default);
    Task<EdoGenerationQueueDto> ListGenerationQueueAsync(Guid? shippingLineId, CancellationToken ct = default);
    Task<EdoDto> ReleaseAsync(Guid id, ReleaseEdoRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<EdoDto> RegeneratePdfAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<IReadOnlyList<EdoDto>> RegeneratePdfByContainersAsync(IReadOnlyList<string> containerNumbers, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<EdoDto> UnlockAsync(Guid id, UnlockEdoRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<int> ProcessExpirationsAsync(CancellationToken ct = default);
    /// <summary>
    /// Pre-forecast renewed eDOs auto-release once pay-to-open payment is verified (no manual release queue).
    /// </summary>
    Task<bool> TryAutoReleasePreForecastRenewalAsync(Guid edoId, Guid actorId, CancellationToken ct = default);
    /// <summary>
    /// Fixes PDF authorization when a non-shipping-line user (e.g. trucker) was stored as ReleasedBy.
    /// </summary>
    Task EnsureEdoPdfSignatoryAsync(Guid edoId, CancellationToken ct = default);
}

public interface IEdoPaymentService
{
    Task<EdoPaymentDto> SubmitAsync(Guid edoId, SubmitEdoPaymentRequest request, string? receiptPath, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<EdoPaymentDto> GetAsync(Guid paymentId, CancellationToken ct = default);
    Task<EdoPaymentDto> ValidateAsync(Guid paymentId, ValidateEdoPaymentRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<EdoPaymentDto> SaveReceiptInsightsAsync(Guid paymentId, SaveEdoPaymentReceiptInsightsRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<IReadOnlyList<EdoPaymentDto>> ListPendingAsync(CancellationToken ct = default);
    Task<IReadOnlyList<EdoPaymentDto>> ListReviewedAsync(CancellationToken ct = default);
    Task<EdoRevenueReportDto> GetRevenueReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default);
}

public interface IEdoRenewalService
{
    Task<RenewalDto> RequestAsync(CreateRenewalRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<RenewalDto> ReviewAsync(Guid id, ReviewRenewalRequest request, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<RenewalDto> SubmitPaymentAsync(Guid id, SubmitRenewalPaymentRequest request, string? receiptPath, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<RenewalDto> MarkPaymentVerifiedAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<EdoDto> GenerateRenewedAsync(Guid renewalId, Guid actorId, string actorRole, CancellationToken ct = default);
    Task<IReadOnlyList<RenewalDto>> ListAsync(Guid actorId, string actorRole, CancellationToken ct = default);
}

public interface IDocumentVerificationService
{
    Task<DocumentVerifyDto> VerifyAsync(string token, CancellationToken ct = default);
}

public interface IQrCodeService
{
    string CreatePngFile(string category, string payload);
    byte[] CreatePngBytes(string payload, int pixelsPerModule = 5);
}
