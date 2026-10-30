import { describe, expect, it } from 'vitest';
import { tutarAyir, tutarYaziyla } from '../src';

describe('tutarYaziyla', () => {
  it('lira ve kuruş', () => {
    expect(tutarYaziyla(1250.75)).toBe('Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş');
    expect(tutarYaziyla('1.250,75')).toBe('Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş');
    expect(tutarYaziyla('₺1.250,75')).toBe('Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş');
  });

  it('kuruşsuz ve lirasız', () => {
    expect(tutarYaziyla(1000)).toBe('Bin Türk Lirası');
    expect(tutarYaziyla(0.5)).toBe('Elli Kuruş');
    expect(tutarYaziyla(0)).toBe('Sıfır Türk Lirası');
  });

  it('sıfırları yazdırmak', () => {
    expect(tutarYaziyla(1000, { sifirKurus: true })).toBe('Bin Türk Lirası Sıfır Kuruş');
    expect(tutarYaziyla(0.5, { sifirLira: true })).toBe('Sıfır Türk Lirası Elli Kuruş');
  });

  it('tek haneli kuruş onluk okunuyor', () => {
    expect(tutarYaziyla(10.5)).toBe('On Türk Lirası Elli Kuruş');
    expect(tutarYaziyla('10,05')).toBe('On Türk Lirası Beş Kuruş');
  });

  it('eksi tutar', () => {
    expect(tutarYaziyla(-25)).toBe('Eksi Yirmi Beş Türk Lirası');
    expect(tutarYaziyla(-0.001)).toBe('Sıfır Türk Lirası');
  });

  it('diğer para birimleri', () => {
    expect(tutarYaziyla(99.9, { para: 'USD' })).toBe('Doksan Dokuz ABD Doları Doksan Sent');
    expect(tutarYaziyla(1, { para: 'EUR' })).toBe('Bir Avro');
    expect(tutarYaziyla(2.5, { para: 'gbp' })).toBe('İki İngiliz Sterlini Elli Peni');
    expect(tutarYaziyla(1500.4, { para: 'JPY' })).toBe('Bin Beş Yüz Japon Yeni');
    expect(tutarYaziyla(5, { para: { ana: 'Kanada Doları', alt: 'Sent', hane: 2 } })).toBe('Beş Kanada Doları');
    expect(() => tutarYaziyla(5, { para: 'XYZ' as 'USD' })).toThrow(/Desteklenenler/);
  });

  it('büyük tutar', () => {
    expect(tutarYaziyla('12.500.000,00')).toBe('On İki Milyon Beş Yüz Bin Türk Lirası');
  });
});

describe('yuvarlama', () => {
  const kurus = (t: number | string) => {
    const p = tutarAyir(t);
    return `${p.eksi ? '-' : ''}${p.ana}.${String(p.alt).padStart(2, '0')}`;
  };

  it('yarım ve üstü yukarı', () => {
    expect(kurus('1250,754')).toBe('1250.75');
    expect(kurus('1250,755')).toBe('1250.76');
    expect(kurus('999,995')).toBe('1000.00');
  });

  it('kayan nokta tuzaklarına düşmüyor', () => {
    // (1.005).toFixed(2) === '1.00', Math.round(1.005 * 100) === 100
    expect(kurus(1.005)).toBe('1.01');
    expect(kurus(0.1 + 0.2)).toBe('0.30');
    expect(kurus(2.675)).toBe('2.68');
  });

  it('istenirse fazla haneyi reddediyor', () => {
    expect(() => tutarAyir('1,005', { fazlaHane: 'hata' })).toThrow(RangeError);
    expect(tutarAyir('1,0500', { fazlaHane: 'hata' }).alt).toBe(5);
  });
});
