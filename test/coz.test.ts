import { describe, expect, it } from 'vitest';
import { tutarYaziyla, yazidanBigInt, yazidanSayiya, yazidanTutar, yaziyla } from '../src';

// Tekrarlanabilir rastgele sayılar
function rastgele(tohum: number) {
  let s = tohum;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

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
    expect(() => yazidanTutar('bin lira yüz elli kuruş')).toThrow(RangeError);
  });
});

describe('gidip dönme', () => {
  it('rastgele tam sayılar', () => {
    const r = rastgele(7);
    for (let i = 0; i < 2000; i++) {
      const n = Math.floor(r() * 10 ** Math.floor(r() * 16));
      expect(yazidanSayiya(yaziyla(n)), String(n)).toBe(n);
    }
  });

  it('rastgele büyük sayılar', () => {
    const r = rastgele(11);
    for (let i = 0; i < 300; i++) {
      let s = String(1 + Math.floor(r() * 9));
      const uzunluk = Math.floor(r() * 26);
      for (let j = 0; j < uzunluk; j++) s += Math.floor(r() * 10);
      expect(yazidanBigInt(yaziyla(s)), s).toBe(BigInt(s));
    }
  });

  it('rastgele tutarlar, bütün yazım seçenekleriyle', () => {
    const r = rastgele(3);
    const secenekler = [{}, { bitisik: true }, { harf: 'buyuk' as const }, { yalniz: true }, { bitisik: true, cerceve: '#' }];
    for (let i = 0; i < 1000; i++) {
      const kurus = Math.floor(r() * 10 ** Math.floor(r() * 12));
      const tutar = `${Math.floor(kurus / 100)},${String(kurus % 100).padStart(2, '0')}`;
      const s = secenekler[i % secenekler.length]!;
      expect(Math.round(yazidanTutar(tutarYaziyla(tutar, s)) * 100), `${tutar} ${JSON.stringify(s)}`).toBe(kurus);
    }
  });
});
