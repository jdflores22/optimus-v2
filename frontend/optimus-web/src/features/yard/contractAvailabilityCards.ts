import type { ContainerDto, CyAllocationDto, ShippingLineDto, TerminalDto, UtilizationReportDto } from '../../shared/types';
import { isContainerYardTerminal, isPortTerminal } from '../../shared/terminalTaxonomy';
import { shippingLineShortCode } from '../../shared/shippingLineDisplay';
import type { ContractTeuLocationCardProps } from '../dashboard/ContractTeuLocationCard';

export type ContractAvailabilityCard = ContractTeuLocationCardProps & {
  terminalId: string;
  allocationId: string;
  available20: number;
  available40: number;
  preForecast: number;
};

export type ContractAvailabilityOptions = {
  /** CY staff: counterparty is the shipping line. SL/terminal: counterparty is the depot/port. */
  focus?: 'location' | 'shippingLine';
  shippingLines?: ShippingLineDto[];
};

export function buildContractAvailabilityCards(
  allocations: CyAllocationDto[],
  terminals: TerminalDto[],
  containers: ContainerDto[],
  utilization: UtilizationReportDto[],
  kind: 'cy' | 'port',
  options: ContractAvailabilityOptions = {},
): ContractAvailabilityCard[] {
  const focus = options.focus ?? 'location';
  const activeTerminals = terminals.filter((terminal) => terminal.isActive);
  const terminalIds = new Set(
    activeTerminals
      .filter((terminal) => (kind === 'cy' ? isContainerYardTerminal(terminal.identity) : isPortTerminal(terminal.identity)))
      .map((terminal) => terminal.id),
  );

  return allocations
    .filter((allocation) => terminalIds.has(allocation.terminalId))
    .map((allocation) => {
      const utilizationRow = utilization.find(
        (row) => row.terminalId === allocation.terminalId || row.terminalName === allocation.terminalName,
      );
      const terminalMeta = activeTerminals.find(
        (terminal) => terminal.id === allocation.terminalId || terminal.name === allocation.terminalName,
      );
      const localContainers = containers.filter(
        (container) =>
          container.cyAllocationId === allocation.id || container.cyTerminalName === allocation.terminalName,
      );
      const allocated20 = localContainers.filter((container) => container.sizeCode?.includes('20')).length;
      const allocated40 = localContainers.filter((container) => container.sizeCode?.includes('40')).length;
      const preForecast = utilizationRow?.pendingPreForecast ?? 0;

      const locationSubtitle = [terminalMeta?.city, terminalMeta?.region].filter(Boolean).join(', ') || terminalMeta?.location || allocation.terminalName;
      const showShippingLine = focus === 'shippingLine' && kind === 'cy';
      const shippingLine = showShippingLine
        ? options.shippingLines?.find((line) => line.id === allocation.shippingLineId)
        : undefined;
      const brandName = shippingLine?.brandName ?? allocation.shippingLineName;

      return {
        terminalId: allocation.terminalId,
        allocationId: allocation.id,
        name: showShippingLine ? brandName : allocation.terminalName,
        subtitle: showShippingLine ? brandName : locationSubtitle,
        code: showShippingLine ? shippingLineShortCode(brandName) : (terminalMeta?.code ?? allocation.terminalName),
        logoPath: showShippingLine ? shippingLine?.logoPath : terminalMeta?.logoPath,
        logoSubject: showShippingLine ? ('shippingLine' as const) : ('terminal' as const),
        brandName: showShippingLine ? brandName : undefined,
        brandColor: showShippingLine ? shippingLine?.brandColor : undefined,
        kind,
        usedTeu: allocation.usedTeu,
        capacityTeu: allocation.allocatedCapacityTeu,
        capacity20: allocation.capacity20Ft,
        capacity40: allocation.capacity40Ft,
        allocated20,
        allocated40,
        pending20: kind === 'cy' ? preForecast : undefined,
        pending40: undefined,
        available20: Math.max(allocation.capacity20Ft - allocated20, 0),
        available40: Math.max(allocation.capacity40Ft - allocated40, 0),
        preForecast,
        typeLabel: showShippingLine ? undefined : kind === 'cy' ? 'Container Yard' : 'Port Terminal',
        unitLimit20Label: '20ft capacity',
        unitLimit40Label: '40ft capacity',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function slotSummaryForDate(
  slots: { date: string; capacity: number; assignedCount: number }[],
  returnDate: string,
): string | null {
  const day = returnDate.slice(0, 10);
  const match = slots.find((slot) => slot.date.slice(0, 10) === day);
  if (!match) return null;
  const remaining = Math.max(match.capacity - match.assignedCount, 0);
  return `${remaining} slot${remaining === 1 ? '' : 's'} left on ${day}`;
}
