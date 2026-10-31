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
  /** 'baslik': Bin İki Yüz, 'kucuk': bin iki yüz, 'buyuk': BİN İKİ YÜZ, 'cumle': Bin iki yüz */
  harf?: Harf;
  /** Kelimeleri boşluksuz yaz: BinİkiYüzElli. Çek ve senette araya kelime eklenemesin diye. */
  bitisik?: boolean;
  /** Başa ve sona konacak işaret, örneğin '#' ya da '***'. */
  cerceve?: string;
}

const KALIN = 'aıou';
const INCE = 'eiöü';
const SERT = 'fstkçşhp';

/**
 * Ek fiil "-dır" eki: Kuruş -> Kuruştur, Lirası -> Lirasıdır, Avro -> Avrodur.
 * Faturadaki "Yalnız ... Kuruştur." kalıbı için.
 */
export function dirEki(kelime: string): string {
  const kucuk = kucukHarf(kelime);
  const unluler = [...kucuk].filter((h) => KALIN.includes(h) || INCE.includes(h));
  const son = unluler[unluler.length - 1] ?? 'a';
  const unlu = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[son] ?? 'ı';
  const sonHarf = kucuk[kucuk.length - 1] ?? '';
  const d = SERT.includes(sonHarf) ? 't' : 'd';
  return kelime + d + unlu + 'r';
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
  const metin = duzenli.join(s.bitisik ? '' : ' ');
  return s.cerceve ? s.cerceve + metin + s.cerceve : metin;
}
