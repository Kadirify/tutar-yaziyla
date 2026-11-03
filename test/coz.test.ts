import { describe, expect, it } from 'vitest';
import { tutarYaziyla, yazidanBigInt, yazidanSayiya, yazidanTutar, yaziyla } from '../src';

describe('yazidanSayiya', () => {
  it.each([
    ['sıfır', 0],
    ['bir', 1],
    ['on bir', 11],
    ['yüz', 100],
    ['iki yüz elli', 250],
    ['bin', 1000],
    ['bin iki yüz elli', 1250],
    ['yüz bir bin', 101000],
    ['bir milyon bin', 1001000],
    ['üç virgül sıfır beş', 3.05],
    ['eksi kırk', -40],
  ])('%s -> %d', (m, n) => {
    expect(yazidanSayiya(m)).toBe(n);
  });

  it('bitişik ve büyük harf', () => {
    expect(yazidanSayiya('BinİkiYüzElli')).toBe(1250);
    expect(yazidanSayiya('BİN İKİ YÜZ ELLİ')).toBe(1250);
    expect(yazidanSayiya('altıyüzaltmışaltı')).toBe(666);
  });

  it('kurala uymayan yazıyı reddediyor', () => {
    expect(() => yazidanSayiya('on on')).toThrow(TypeError);
    expect(() => yazidanSayiya('bin milyon')).toThrow(TypeError);
    expect(() => yazidanSayiya('beş dört')).toThrow(TypeError);
    expect(() => yazidanSayiya('yüz yüz')).toThrow(TypeError);
    expect(() => yazidanSayiya('elmas')).toThrow(/anlaşılamadı/);
    expect(() => yazidanSayiya('')).toThrow(TypeError);
  });

  it("para birimi varsa yazidanTutar'a yönlendiriyor", () => {
    expect(() => yazidanSayiya('bin türk lirası')).toThrow(/yazidanTutar/);
  });

  it('JavaScript sayısına sığmayanı yazidanBigInt ile okuyor', () => {
    expect(() => yazidanSayiya('on kentilyon')).toThrow(/yazidanBigInt/);
    expect(yazidanBigInt('on kentilyon')).toBe(10n ** 19n);
  });
});

describe('yazidanTutar', () => {
  it('tam kalıp', () => {
    expect(yazidanTutar('Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş')).toBe(1250.75);
    expect(yazidanTutar('Elli Kuruş')).toBe(0.5);
    expect(yazidanTutar('Doksan Dokuz ABD Doları Doksan Sent')).toBe(99.9);
  });

  it('çek ve fatura yazımları', () => {
    expect(yazidanTutar('#BinİkiYüzElliTürkLirasıYetmişBeşKuruş#')).toBe(1250.75);
    expect(yazidanTutar('Yalnız Bin Türk Lirasıdır')).toBe(1000);
    expect(yazidanTutar('Yalnız Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruştur.')).toBe(1250.75);
    expect(yazidanTutar('***BİNTL***')).toBe(1000);
  });

  it('kısa ve eksik yazımlar', () => {
    expect(yazidanTutar('bin lira elli')).toBe(1000.5);
    expect(yazidanTutar('bin iki yüz')).toBe(1200);
  });

  it('kuralsız tutarı reddediyor', () => {
    expect(() => yazidanTutar('bin lira beş lira')).toThrow(TypeError);
    expect(() => yazidanTutar('bin lira beş kuruş on kuruş')).toThrow(TypeError);
    expect(() => yazidanTutar('bin lira yüz elli kuruş')).toThrow(RangeError);
  });
});

describe('yanlış okumak yerine hata veriyor', () => {
  it('rakam ve yazı karışık metni reddediyor', () => {
    expect(() => yazidanTutar('5 Milyon Lira')).toThrow(/Rakam var/);
    expect(() => yazidanTutar('1.250 Lira')).toThrow(/Rakam var/);
    expect(() => yazidanSayiya('10')).toThrow(/Rakam var/);
  });

  it('eksi işaretini okuyor', () => {
    expect(yazidanTutar('-bin lira')).toBe(-1000);
    expect(yazidanSayiya('− kırk')).toBe(-40);
  });

  it('sayısız tutarı reddediyor', () => {
    expect(() => yazidanTutar('Türk Lirası')).toThrow(TypeError);
    expect(() => yazidanTutar('Kuruş')).toThrow(TypeError);
  });

  it('para birimleri karışmıyor', () => {
    expect(() => yazidanTutar('Bin Dolar Elli Kuruş')).toThrow(/iki farklı para/);
    expect(() => yazidanTutar('Bin Lira Türk')).toThrow(TypeError);
    expect(yazidanTutar('Bin Avro Elli Sent')).toBe(1000.5);
  });

  it('bir bin, bir yüz ve tek başına milyon hata veriyor', () => {
    expect(() => yazidanSayiya('bir bin')).toThrow(/"bin" olmalı/);
    expect(() => yazidanSayiya('bir yüz')).toThrow(/"yüz" olmalı/);
    expect(() => yazidanSayiya('milyon bin')).toThrow(/önünde sayı yok/);
    expect(yazidanSayiya('yüz bir bin')).toBe(101000);
    expect(yazidanSayiya('bir milyon bir yüz', { esnek: true })).toBe(1000100);
  });
});

describe('başka yazımlar', () => {
  it("TL'dir, Euro'dur", () => {
    expect(yazidanTutar("Yalnız Bin TL'dir")).toBe(1000);
    expect(yazidanTutar("Bin Euro'dur")).toBe(1000);
  });

  it('Türkçe karaktersiz', () => {
    expect(yazidanSayiya('iki yuz elli')).toBe(250);
    expect(yazidanSayiya('IKI YUZ')).toBe(200);
    expect(yazidanTutar('bin turk lirasi elli kurus')).toBe(1000.5);
  });
});

describe('yazıya çevirip geri okuyunca aynı sayı', () => {
  it('tam sayılar', () => {
    for (let n = 0; n <= 2000; n++) expect(yazidanSayiya(yaziyla(n))).toBe(n);
    for (let n = 2001; n < 1e15; n = n * 3 + 7) expect(yazidanSayiya(yaziyla(n)), String(n)).toBe(n);
  });

  it('büyük sayılar', () => {
    for (let n = 1n; n < 10n ** 27n; n = n * 13n + 7n) expect(yazidanBigInt(yaziyla(n)), String(n)).toBe(n);
  });

  it('tutarlar', () => {
    for (let k = 1; k < 1e12; k = k * 7 + 3) {
      const tutar = `${Math.floor(k / 100)},${String(k % 100).padStart(2, '0')}`;
      expect(Math.round(yazidanTutar(tutarYaziyla(tutar)) * 100), tutar).toBe(k);
      expect(Math.round(yazidanTutar(tutarYaziyla(tutar, { bitisik: true, cerceve: '#' })) * 100), tutar).toBe(k);
    }
  });
});
