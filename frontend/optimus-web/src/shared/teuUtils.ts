/** 20ft container slot = 1 TEU */
export function teuFrom20FtSlots(slots: number): number {
  return Math.max(0, slots || 0);
}

/** 40ft container slot = 2 TEU each */
export function teuFrom40FtSlots(slots: number): number {
  return Math.max(0, slots || 0) * 2;
}

export function computeContractTeu(capacity20Ft: number, capacity40Ft: number): number {
  return teuFrom20FtSlots(capacity20Ft) + teuFrom40FtSlots(capacity40Ft);
}
