import { buildQrMatrix, QR_MATRIX_SIZE } from './qr-code';

describe('buildQrMatrix', () => {
  it('returns one flat matrix of the requested size', () => {
    expect(buildQrMatrix('SC-1').length).toBe(QR_MATRIX_SIZE * QR_MATRIX_SIZE);
    expect(buildQrMatrix('SC-1', 25).length).toBe(625);
  });

  it('draws the three finder squares a scanner expects', () => {
    const size = QR_MATRIX_SIZE;
    const cells = buildQrMatrix('SMARTCAMPUS|CAFETERIA|CAF-1');
    const at = (row: number, col: number): boolean => cells[row * size + col];

    for (const [row, col] of [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ]) {
      expect(at(row, col)).toBeTrue();
      expect(at(row + 6, col + 6)).toBeTrue();
      expect(at(row + 3, col + 3)).toBeTrue();
      expect(at(row + 1, col + 1)).toBeFalse();
    }
  });

  it('is deterministic for the same payload and differs for another', () => {
    expect(buildQrMatrix('TICKET-A')).toEqual(buildQrMatrix('TICKET-A'));
    expect(buildQrMatrix('TICKET-A')).not.toEqual(buildQrMatrix('TICKET-B'));
  });

  it('returns an empty matrix without a payload', () => {
    expect(buildQrMatrix('').some(Boolean)).toBeFalse();
  });
});
