using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Optimus.Application.Platform.Dtos;
using Optimus.Domain.Enums;
using Optimus.Infrastructure.Persistence;

namespace Optimus.Api.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Policy = "SystemAdmin")]
public class AdminDashboardController : ControllerBase
{
    private readonly OptimusDbContext _db;

    public AdminDashboardController(OptimusDbContext db) => _db = db;

    [HttpGet("metrics")]
    public async Task<ActionResult<AdminDashboardMetricsDto>> Metrics(CancellationToken cancellationToken)
    {
        var since7Days = DateTime.UtcNow.AddDays(-7);
        var startOfToday = DateTime.UtcNow.Date;

        var auditLogsLast7Days = await _db.ActivityLogs
            .AsNoTracking()
            .CountAsync(x => x.CreatedAt >= since7Days, cancellationToken);

        var totalManifests = await _db.Manifests.AsNoTracking().CountAsync(cancellationToken);

        var paymentQuery = _db.EdoPayments.AsNoTracking();
        var totalEdoPayments = await paymentQuery.CountAsync(cancellationToken);
        var totalEdoPaymentAmount = totalEdoPayments == 0
            ? 0m
            : await paymentQuery.SumAsync(x => x.Amount, cancellationToken);

        var pendingQuery = paymentQuery.Where(x => x.Status == PaymentStatus.PendingValidation);
        var pendingEdoPayments = await pendingQuery.CountAsync(cancellationToken);
        var pendingEdoPaymentAmount = pendingEdoPayments == 0
            ? 0m
            : await pendingQuery.SumAsync(x => x.Amount, cancellationToken);

        var verifiedQuery = paymentQuery.Where(x => x.Status == PaymentStatus.Verified);
        var verifiedEdoPayments = await verifiedQuery.CountAsync(cancellationToken);
        var verifiedEdoPaymentAmount = verifiedEdoPayments == 0
            ? 0m
            : await verifiedQuery.SumAsync(x => x.Amount, cancellationToken);

        var dailyVerifiedFees = await paymentQuery
            .Where(x => x.Status == PaymentStatus.Verified && x.ValidatedAt >= startOfToday)
            .SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;

        var readyToRelease = await _db.ElectronicDeliveryOrders
            .AsNoTracking()
            .CountAsync(x => x.Status == EdoStatus.PendingRelease, cancellationToken);

        var pendingAccreditations = await _db.AccreditationSubmissions
            .AsNoTracking()
            .CountAsync(x => x.Status == AccreditationStatus.AwaitingFinalApproval, cancellationToken);

        return Ok(new AdminDashboardMetricsDto(
            auditLogsLast7Days,
            totalManifests,
            totalEdoPayments,
            totalEdoPaymentAmount,
            pendingEdoPayments,
            pendingEdoPaymentAmount,
            verifiedEdoPayments,
            verifiedEdoPaymentAmount,
            dailyVerifiedFees,
            readyToRelease,
            pendingAccreditations));
    }
}
