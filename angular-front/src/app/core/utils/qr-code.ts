/**
 * Deterministic QR-looking matrix for demo receipts and event tickets.
 *
 * This is not an ISO/IEC 18004 encoder. It renders the same three finder
 * squares a scanner expects plus a stable data field derived from the payload,
 * which is enough for a realistic demo without pulling in a QR library.
 */
export const QR_MATRIX_SIZE = 21;

export function buildQrMatrix(code: string, size: number = QR_MATRIX_SIZE): boolean[] {
  const cells = new Array<boolean>(size * size).fill(false);
  if (!code) {
    return cells;
  }

  let hash = 2166136261;
  for (let i = 0; i < code.length; i += 1) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let i = 0; i < cells.length; i += 1) {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    cells[i] = (hash & 1) === 1;
  }

  const finder = (row: number, col: number): void => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[(row + r) * size + (col + c)] = border || core;
      }
    }
  };

  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  return cells;
}
