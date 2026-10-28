import { describe, expect, it } from 'vitest';
import { SINIR, tamSayiKelimeleri } from '../src/kelimeler';

const yaz = (n: number | bigint) => tamSayiKelimeleri(BigInt(n)).join(' ');

describe('tamSayiKelimeleri', () => {
  it.each([
    [0, 'sıfır'],
    [1, 'bir'],
    [9, 'dokuz'],
    [10, 'on'],
    [11, 'on bir'],
    [19, 'on dokuz'],
    [20, 'yirmi'],
    [46, 'kırk altı'],
    [99, 'doksan dokuz'],
    [100, 'yüz'],
    [101, 'yüz bir'],
    [110, 'yüz on'],
    [200, 'iki yüz'],
    [999, 'dokuz yüz doksan dokuz'],
  ])('%i -> %s', (n, beklenen) => {
    expect(yaz(n)).toBe(beklenen);
  });

  it.each([
    [1000, 'bin'],
    [1001, 'bin bir'],
    [1100, 'bin yüz'],
    [1250, 'bin iki yüz elli'],
    [2000, 'iki bin'],
    [10000, 'on bin'],
    [11000, 'on bir bin'],
    [100000, 'yüz bin'],
    [101000, 'yüz bir bin'],
    [999999, 'dokuz yüz doksan dokuz bin dokuz yüz doksan dokuz'],
  ])('binler: %i -> %s', (n, beklenen) => {
    expect(yaz(n)).toBe(beklenen);
  });

  it.each([
    [1_000_000, 'bir milyon'],
    [1_001_000, 'bir milyon bin'],
    [1_000_001, 'bir milyon bir'],
    [1_100_000, 'bir milyon yüz bin'],
    [2_500_000, 'iki milyon beş yüz bin'],
    [1_000_000_000, 'bir milyar'],
    [1_000_000_000_000, 'bir trilyon'],
  ])('büyük sayılar: %i -> %s', (n, beklenen) => {
    expect(yaz(n)).toBe(beklenen);
  });

  it('boş grupları atlıyor', () => {
    expect(yaz(1_000_000_000_001n)).toBe('bir trilyon bir');
    expect(yaz(5_000_000_070_000n)).toBe('beş trilyon yetmiş bin');
  });

  it('septilyona kadar gidiyor', () => {
    expect(yaz(10n ** 24n)).toBe('bir septilyon');
    expect(yaz(SINIR - 1n).split(' ')[0]).toBe('dokuz');
  });

  it('sınırın üstünde açıklayıcı hata veriyor', () => {
    expect(() => tamSayiKelimeleri(SINIR)).toThrow(/27 basamak/);
  });
});
