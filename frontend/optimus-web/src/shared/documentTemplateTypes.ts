export const DOCUMENT_TEMPLATE_TYPES = [
  { id: 'NOA', label: 'Notice of Arrival (NOA)' },
  { id: 'EDO', label: 'Electronic Delivery Order (eDO)' },
  { id: 'BL', label: 'Manifest / Bill of Lading' },
  { id: 'Billing', label: 'Billing Statement' },
  { id: 'OR', label: 'Official Receipt' },
  { id: 'Certificate', label: 'Certificate' },
] as const;

export type DocumentTemplateTypeId = (typeof DOCUMENT_TEMPLATE_TYPES)[number]['id'];

export function documentTypeLabel(documentType: string): string {
  return DOCUMENT_TEMPLATE_TYPES.find((t) => t.id === documentType)?.label ?? documentType;
}

const SHORT_LABELS: Record<string, string> = {
  NOA: 'NOA',
  EDO: 'eDO',
  BL: 'Manifest / BL',
  Billing: 'Billing',
  OR: 'Receipt',
  Certificate: 'Certificate',
};

export function documentTypeShortLabel(documentType: string): string {
  return SHORT_LABELS[documentType] ?? documentType;
}

export function defaultDocumentTemplateHtml(documentType: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${documentType}</title></head>
<body>
  <h1>${documentTypeLabel(documentType)}</h1>
  <p>{{content}}</p>
</body>
</html>`;
}
