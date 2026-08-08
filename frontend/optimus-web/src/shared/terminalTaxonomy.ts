/** Terminal category — CY vs port terminal facility. */
export type TerminalTypeValue = 'ContainerYard' | 'PortTerminal';

/** Port-terminal operator brand (not a terminal type). */
export type PortTerminalOperator = 'Ati' | 'Ictsi';

export const TERMINAL_TYPE_OPTIONS = [
  { value: 'ContainerYard' as const, label: 'Container Yard' },
  { value: 'PortTerminal' as const, label: 'Port Terminal' },
];

export const PORT_TERMINAL_OPERATOR_OPTIONS = [
  { value: 'Ati' as const, label: 'ATI' },
  { value: 'Ictsi' as const, label: 'ICTSI' },
];

/** Normalize legacy API value `Terminal` → `PortTerminal`. */
export function normalizeTerminalType(identity: string): TerminalTypeValue {
  if (identity === 'ContainerYard') return 'ContainerYard';
  return 'PortTerminal';
}

export function isContainerYardTerminal(identity: string): boolean {
  return normalizeTerminalType(identity) === 'ContainerYard';
}

export function isPortTerminal(identity: string): boolean {
  return !isContainerYardTerminal(identity);
}

export function terminalTypeLabel(identity: string): string {
  return isContainerYardTerminal(identity) ? 'Container Yard' : 'Port Terminal';
}

export function portOperatorLabel(kind: string): string {
  return (
    PORT_TERMINAL_OPERATOR_OPTIONS.find((o) => o.value.toLowerCase() === kind.toLowerCase())?.label ?? kind
  );
}

/** Resolve persisted `kind` from type + operator selection. */
export function resolveTerminalKind(terminalType: TerminalTypeValue, operator: string): string {
  return terminalType === 'ContainerYard' ? 'Cy' : operator;
}

/** Operator shown only for port terminals. */
export function terminalOperatorForDisplay(terminal: { identity: string; kind: string }): string | null {
  return isPortTerminal(terminal.identity) ? portOperatorLabel(terminal.kind) : null;
}

export function terminalMatchesTypeFilter(terminal: { identity: string }, typeFilter: string): boolean {
  if (!typeFilter) return true;
  return normalizeTerminalType(terminal.identity) === typeFilter;
}

export function terminalMatchesOperatorFilter(terminal: { identity: string; kind: string }, operatorFilter: string): boolean {
  if (!operatorFilter) return true;
  return isPortTerminal(terminal.identity) && terminal.kind.toLowerCase() === operatorFilter.toLowerCase();
}
