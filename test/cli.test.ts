import { describe, expect, it } from 'vitest';
import { calistir } from '../src/cli';

const c = (...a: string[]) => calistir(a).cikti;

describe('cli', () => {
  it('tutar', () => {
    expect(c('1.250,75')).toBe('Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş');
    expect(c('₺1.250,75')).toBe('Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş');
    expect(c('1250.75', '--bitisik', '--cerceve=#')).toBe('#BinİkiYüzElliTürkLirasıYetmişBeşKuruş#');
    expect(c('99,9', '--para=USD')).toBe('Doksan Dokuz ABD Doları Doksan Sent');
    expect(c('1000', '--yalniz')).toBe('Yalnız Bin Türk Lirasıdır');
  });

  it('sayı ve sıra', () => {
    expect(c('--sayi', '3,05')).toBe('üç virgül sıfır beş');
    expect(c('--sira', '100')).toBe('yüzüncü');
    expect(c('--sayi', '1250', '--buyuk')).toBe('BİN İKİ YÜZ ELLİ');
  });

  it('yazıdan rakama', () => {
    expect(c('Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş')).toBe('1250.75');
    expect(c('bin', 'iki', 'yüz', 'elli')).toBe('1250');
  });

  it('hata kodları', () => {
    expect(calistir(['abc'])).toMatchObject({ kod: 1 });
    expect(calistir(['1', '--para=XYZ'])).toMatchObject({ kod: 1 });
    expect(calistir(['--bilinmeyen'])).toMatchObject({ kod: 2 });
    expect(calistir([])).toMatchObject({ kod: 2 });
    expect(c('--help')).toContain('Kullanım:');
  });
});
