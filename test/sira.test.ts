import { describe, expect, it } from 'vitest';
import { siraSayisi } from '../src';

describe('siraSayisi', () => {
  it.each([
    [0, 'sıfırıncı'],
    [1, 'birinci'],
    [2, 'ikinci'],
    [3, 'üçüncü'],
    [4, 'dördüncü'],
    [5, 'beşinci'],
    [6, 'altıncı'],
    [7, 'yedinci'],
    [8, 'sekizinci'],
    [9, 'dokuzuncu'],
    [10, 'onuncu'],
    [20, 'yirminci'],
    [30, 'otuzuncu'],
    [40, 'kırkıncı'],
    [50, 'ellinci'],
    [60, 'altmışıncı'],
    [70, 'yetmişinci'],
    [80, 'sekseninci'],
    [90, 'doksanıncı'],
    [100, 'yüzüncü'],
    [1000, 'bininci'],
    [1_000_000, 'bir milyonuncu'],
    [1_000_000_000, 'bir milyarıncı'],
  ])('%i -> %s', (n, beklenen) => {
    expect(siraSayisi(n)).toBe(beklenen);
  });

  it('bileşik sayılar', () => {
    expect(siraSayisi(23)).toBe('yirmi üçüncü');
    expect(siraSayisi(104)).toBe('yüz dördüncü');
    expect(siraSayisi(2026)).toBe('iki bin yirmi altıncı');
  });

  it('harf seçeneği', () => {
    expect(siraSayisi(100, { harf: 'baslik' })).toBe('Yüzüncü');
    expect(siraSayisi(1, { harf: 'buyuk' })).toBe('BİRİNCİ');
  });

  it('negatif ve ondalığı reddediyor', () => {
    expect(() => siraSayisi(-1)).toThrow(RangeError);
    expect(() => siraSayisi(1.5)).toThrow(RangeError);
    expect(siraSayisi('3,00')).toBe('üçüncü');
    expect(siraSayisi(-0)).toBe('sıfırıncı');
  });
});
