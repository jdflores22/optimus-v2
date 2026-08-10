namespace Optimus.Application.Platform.Interfaces;

public record TransactionResetResultDto(
    int TablesCleared,
    int TerminalSlotsReset);

public interface ITransactionResetService
{
    Task<TransactionResetResultDto> ResetAsync(CancellationToken ct = default);
}
