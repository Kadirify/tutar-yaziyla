import { describe, expect, it } from 'vitest';
import { yaziyla } from '../src';
import { ayir } from '../src/girdi';

describe('yaziyla', () => {
  it('tam sayı', () => {
    expect(yaziyla(1250)).toBe('bin iki yüz elli');
    expect(yaziyla(0)).toBe('sıfır');
  });

  it('ondalık', () => {
    expect(yaziyla(3.5)).toBe('üç virgül beş');
    expect(yaziyla('3,05')).toBe('üç virgül sıfır beş');
    expect(yaziyla('3,50')).toBe('üç virgül elli');
    expect(yaziyla(0.001)).toBe('sıfır virgül sıfır sıfır bir');
    expect(yaziyla('7,00')).toBe('yedi');
  });

  it('eksi', () => {
    expect(yaziyla(-40)).toBe('eksi kırk');
    expect(yaziyla(-0.5)).toBe('eksi sıfır virgül beş');
    expect(yaziyla(-0)).toBe('sıfır');
  });

  it('bigint ve büyük metin', () => {
    expect(yaziyla(12_345_678_901_234_567n)).toBe(
      'on iki katrilyon üç yüz kırk beş trilyon altı yüz yetmiş sekiz milyar dokuz yüz bir milyon iki yüz otuz dört bin beş yüz altmış yedi',
    );
    expect(yaziyla('1000000000000000000')).toBe('bir kentilyon');
  });

  it('hassasiyeti kaybolmuş sayıyı reddediyor', () => {
    expect(() => yaziyla(12345678901234567)).toThrow(/metin ya da bigint/);
  });

  it('üslü gösterimi açıyor', () => {
    expect(yaziyla(1e-7)).toBe('sıfır virgül sıfır sıfır sıfır sıfır sıfır sıfır bir');
    // büyük üslü sayılar zaten güvenli tam sayı sınırının üstünde
    expect(() => yaziyla(1.5e20)).toThrow(RangeError);
    expect(yaziyla('150000000000000000000')).toBe('yüz elli kentilyon');
  });

  it('sonsuz ve NaN', () => {
    expect(() => yaziyla(Infinity)).toThrow(RangeError);
    expect(() => yaziyla(NaN)).toThrow(RangeError);
  });
});

describe('metin girdisi', () => {
  const tam = (m: string, o?: ',' | '.') => {
    const a = ayir(m, { ondalik: o });
    return `${a.eksi ? '-' : ''}${a.tam}${a.kesir ? `.${a.kesir}` : ''}`;
  };

  it('Türkçe ve İngilizce biçimler', () => {
    expect(tam('1.250,75')).toBe('1250.75');
    expect(tam('1,250.75')).toBe('1250.75');
    expect(tam('1250,75')).toBe('1250.75');
    expect(tam('1250.75')).toBe('1250.75');
    expect(tam('1.250.000')).toBe('1250000');
    expect(tam('1,250,000')).toBe('1250000');
  });

  it('tek nokta ve üç rakam Türkçedeki gibi binlik', () => {
    expect(tam('1.250')).toBe('1250');
    expect(tam('1.250', '.')).toBe('1.250');
  });

  it('sıfırla başlayan "0.250" binlik sayılmıyor', () => {
    expect(tam('0.250')).toBe('0.250');
    expect(tam('000.500')).toBe('0.500');
    expect(() => ayir('0.250.000')).toThrow(/Binlik/);
  });

  it('para işaretleri ve boşluklar', () => {
    expect(tam('₺1.250,75')).toBe('1250.75');
    expect(tam('1.250,75 TL')).toBe('1250.75');
    expect(tam('1 250,75')).toBe('1250.75');
    expect(tam('1\u00a0250,75')).toBe('1250.75'); // bölünmez boşluk
    expect(tam('-1.250,75')).toBe('-1250.75');
    expect(tam('−5')).toBe('-5');
  });

  it('bozuk girdiyi reddediyor', () => {
    expect(() => ayir('12.50,00')).toThrow(/Binlik/);
    expect(() => ayir('1,2,5')).toThrow(RangeError);
    expect(() => ayir('abc')).toThrow(TypeError);
    expect(() => ayir('')).toThrow(TypeError);
    expect(() => ayir('1,')).toThrow(RangeError);
    expect(() => ayir({} as unknown as string)).toThrow(TypeError);
  });
});
