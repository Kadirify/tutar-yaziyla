// toUpperCase() i/ı ayrımını bilmiyor, 'iki' -> 'IKI' oluyor

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
const UYUM: Record<string, string> = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' };

/** ABD, TL gibi kısaltmalar */
function kisaltma(w: string): boolean {
  return w.length > 1 && w === buyukHarf(w);
}

export function dirEki(kelime: string): string {
  const kucuk = kucukHarf(kelime);
  const sonHarf = kucuk[kucuk.length - 1] ?? '';
  // Kısaltma harf harf okunuyor: TL "te-le" -> TL'dir, Kr "ka-re" -> Kr'dir
  if (kisaltma(kelime) || ![...kucuk].some((h) => KALIN.includes(h) || INCE.includes(h))) {
    return `${kelime}'d${UYUM[sonHarf] ?? 'i'}r`;
  }
  const unluler = [...kucuk].filter((h) => KALIN.includes(h) || INCE.includes(h));
  const unlu = UYUM[unluler[unluler.length - 1]!]!;
  const d = SERT.includes(sonHarf) ? 't' : 'd';
  return kelime + d + unlu + 'r';
}

/**
 * @param ozel Cümle düzeninde de büyük harfle başlayacak özel adlar ("türk", "ingiliz")
 */
export function birlestir(
  kelimeler: readonly string[],
  s: YazimSecenekleri,
  varsayilanHarf: Harf,
  ozel: ReadonlySet<string> = new Set(),
): string {
  const harf = s.harf ?? varsayilanHarf;
  const duzenli = kelimeler.map((w, i) => {
    // kısaltmalar her düzende olduğu gibi kalıyor
    if (kisaltma(w.replace(/'.*$/, ''))) return w;
    const kucuk = kucukHarf(w);
    if (harf === 'buyuk') return buyukHarf(kucuk);
    if (harf === 'baslik') return ilkHarfBuyuk(kucuk);
    if (harf === 'cumle' && (i === 0 || ozel.has(kucuk))) return ilkHarfBuyuk(kucuk);
    return kucuk;
  });
  const metin = duzenli.join(s.bitisik ? '' : ' ');
  return s.cerceve ? s.cerceve + metin + s.cerceve : metin;
}
