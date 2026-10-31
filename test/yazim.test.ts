import { describe, expect, it } from 'vitest';
import { tutarYaziyla, yaziyla } from '../src';
import { buyukHarf, dirEki, kucukHarf } from '../src/yazim';

describe('Türkçe harf dönüşümü', () => {
  it('i ve ı doğru', () => {
    expect(buyukHarf('iki ışık')).toBe('İKİ IŞIK');
    expect(kucukHarf('İKİ IŞIK')).toBe('iki ışık');
  });
});

describe('harf düzeni', () => {
  it('dört seçenek', () => {
    expect(yaziyla(1250, { harf: 'kucuk' })).toBe('bin iki yüz elli');
    expect(yaziyla(1250, { harf: 'baslik' })).toBe('Bin İki Yüz Elli');
    expect(yaziyla(1250, { harf: 'buyuk' })).toBe('BİN İKİ YÜZ ELLİ');
    expect(yaziyla(1250, { harf: 'cumle' })).toBe('Bin iki yüz elli');
  });

  it('kısaltmalar büyük kalıyor', () => {
    expect(tutarYaziyla(1, { para: 'USD', harf: 'kucuk' })).toBe('bir ABD doları');
  });
});

describe('çek ve senet yazımı', () => {
  it('bitişik', () => {
    expect(tutarYaziyla(1250.75, { bitisik: true })).toBe('BinİkiYüzElliTürkLirasıYetmişBeşKuruş');
  });

  it('çerçeve', () => {
    expect(tutarYaziyla(1250, { bitisik: true, cerceve: '#' })).toBe('#BinİkiYüzElliTürkLirası#');
    expect(tutarYaziyla(1250, { harf: 'buyuk', bitisik: true, cerceve: '***' })).toBe('***BİNİKİYÜZELLİTÜRKLİRASI***');
  });
});

describe('Yalnız ... -dır', () => {
  it('fatura kalıbı', () => {
    expect(tutarYaziyla(1250.75, { yalniz: true })).toBe('Yalnız Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruştur');
    expect(tutarYaziyla(1000, { yalniz: true })).toBe('Yalnız Bin Türk Lirasıdır');
  });

  it.each([
    ['Kuruş', 'Kuruştur'],
    ['Lirası', 'Lirasıdır'],
    ['Avro', 'Avrodur'],
    ['Sent', 'Senttir'],
    ['Peni', 'Penidir'],
    ['Santim', 'Santimdir'],
    ['Frangı', 'Frangıdır'],
    ['Doları', 'Dolarıdır'],
    ['Sterlini', 'Sterlinidir'],
    ['Yeni', 'Yenidir'],
    ['Yüz', 'Yüzdür'],
  ])('%s -> %s', (k, beklenen) => {
    expect(dirEki(k)).toBe(beklenen);
  });
});
