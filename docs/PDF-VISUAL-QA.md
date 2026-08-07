# PDF visual QA (T7.4)

V2 currently emits **placeholder text documents** via `DocumentStore.CreatePlaceholderPdf` (`.txt` under `/uploads/...`), not pixel-perfect PDF engines.

## Compare checklist vs Symfony samples

| Document | V2 path pattern | Visual parity |
|----------|-----------------|---------------|
| NOA | `/uploads/noa/*` | Content fields present; layout TBD |
| BL | `/uploads/bl/*` | Content fields present; layout TBD |
| Billing | `/uploads/billing/*` | Amounts present; layout TBD |
| Official receipt | `/uploads/receipts/*` | Amounts present; layout TBD |
| eDO/CRO | `/uploads/edo/*` | Number/QR payload present; layout TBD |
| Pre-advice package | `/uploads/preadvice/*` | Fields present; layout TBD |
| Reports | `/uploads/reports/*` | Metrics CSV + placeholder |

## Sign-off criteria for true PDF parity (follow-up)

- [ ] Pick PDF library (QuestPDF / iText / similar)  
- [ ] Port Symfony Twig/PDF templates → C#  
- [ ] Side-by-side screenshot QA with client samples  
- [ ] Replace placeholder generator

Until then, mark T7.4 as **process documented; visual parity deferred**.
