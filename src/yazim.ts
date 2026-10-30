/**
 * Harf düzeni ve birleştirme. Türkçede i/İ ve ı/I ayrı harfler olduğu için
 * toUpperCase() tek başına yetmiyor: 'iki'.toUpperCase() -> 'IKI' oluyor.
 */

export type Harf = 'baslik' | 'kucuk' | 'buyuk' | 'cumle';

export function buyukHarf(s: string): string {
  return s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
}

export function kucukHarf(s: string): string {
  return s.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
}

function ilkHarfBuyuk(s: string): string {
  return s ? buyukHarf(s[0]!) + s.slice(1) : s;
}

export interface YazimSecenekleri {
  harf?: Harf;
  /** Kelimeleri boşluksuz yaz. Çek ve senette araya bir şey eklenmesin diye böyle yazılıyor. */
  bitisik?: boolean;
}

export function birlestir(kelimeler: readonly string[], s: YazimSecenekleri, varsayilanHarf: Harf): string {
  const harf = s.harf ?? varsayilanHarf;
  // ABD gibi kısaltmalar her düzende büyük kalıyor
  const kisaltma = (w: string) => w.length > 1 && w === buyukHarf(w);
  const duzenli = kelimeler.map((w, i) => {
    if (kisaltma(w)) return w;
    const kucuk = kucukHarf(w);
    if (harf === 'buyuk') return buyukHarf(kucuk);
    if (harf === 'baslik') return ilkHarfBuyuk(kucuk);
    if (harf === 'cumle' && i === 0) return ilkHarfBuyuk(kucuk);
    return kucuk;
  });
  return duzenli.join(s.bitisik ? '' : ' ');
}
