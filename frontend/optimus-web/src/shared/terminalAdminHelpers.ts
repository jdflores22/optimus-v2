import {
  PORT_TERMINAL_OPERATOR_OPTIONS,
  normalizeTerminalType,
  portOperatorLabel,
  resolveTerminalKind,
  type PortTerminalOperator,
  type TerminalTypeValue,
} from './terminalTaxonomy';
import {
  addressSerializedToTerminalFields,
  terminalToAddressSerialized,
} from './terminalAddressHelpers';

export {
  PORT_TERMINAL_OPERATOR_OPTIONS,
  TERMINAL_TYPE_OPTIONS,
  normalizeTerminalType,
  portOperatorLabel,
  terminalTypeLabel,
  isContainerYardTerminal,
  isPortTerminal,
  terminalOperatorForDisplay,
} from './terminalTaxonomy';

export function suggestTerminalCode(name: string, terminalType: TerminalTypeValue, operator: string): string {
  const prefix = terminalType === 'ContainerYard' ? 'CY' : portOperatorLabel(operator || 'Ati');
  const slug = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  return slug ? `${prefix}-${slug}` : `${prefix}-NEW`;
}

export type TerminalFormState = {
  name: string;
  code: string;
  terminalType: TerminalTypeValue;
  operator: PortTerminalOperator | '';
  addressSerialized: string;
  isActive: boolean;
};

export function emptyTerminalForm(): TerminalFormState {
  return {
    name: '',
    code: '',
    terminalType: 'ContainerYard',
    operator: '',
    addressSerialized: '',
    isActive: false,
  };
}

export function terminalToForm(terminal: {
  name: string;
  code: string;
  identity: string;
  kind: string;
  location?: string | null;
  region?: string | null;
  city?: string | null;
  isActive: boolean;
}): TerminalFormState {
  const terminalType = normalizeTerminalType(terminal.identity);
  const operator =
    terminalType === 'PortTerminal' &&
    PORT_TERMINAL_OPERATOR_OPTIONS.some((o) => o.value.toLowerCase() === terminal.kind.toLowerCase())
      ? (terminal.kind as PortTerminalOperator)
      : '';

  return {
    name: terminal.name,
    code: terminal.code,
    terminalType,
    operator,
    addressSerialized: terminalToAddressSerialized(terminal),
    isActive: terminal.isActive,
  };
}

export function formToPayload(form: TerminalFormState, isCreate: boolean) {
  if (form.terminalType === 'PortTerminal' && !form.operator) {
    throw new Error('Port terminals require an operator (ATI or ICTSI).');
  }

  const identity = form.terminalType;
  const kind = resolveTerminalKind(form.terminalType, form.operator);
  const address = addressSerializedToTerminalFields(form.addressSerialized);

  return {
    name: form.name.trim(),
    code: form.code.trim(),
    identity,
    kind,
    location: address.location,
    region: address.region,
    city: address.city,
    dailyCapacity: 0,
    isActive: isCreate ? false : form.isActive,
  };
}
