export function edoPayToOpenPath(edoId: string, from?: 'pre-forecast') {
  return from ? `/edo/${edoId}/payment?from=${from}` : `/edo/${edoId}/payment`;
}
