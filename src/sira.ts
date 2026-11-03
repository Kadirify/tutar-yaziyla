import { ayir, type SayiGirdisi } from './girdi';
import { tamSayiKelimeleri } from './kelimeler';
import { birlestir, kucukHarf, type YazimSecenekleri } from './yazim';

const UYUM: Record<string, string> = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' };

/** -(I)ncI eki: üç -> üçüncü, altı -> altıncı, dört -> dördüncü */
export function siraEki(kelime: string): string {
  let k = kucukHarf(kelime);
  const unluler = [...k].filter((h) => h in UYUM);
  const u = UYUM[unluler[unluler.length - 1] ?? 'a']!;
  const unluyleBitiyor = k[k.length - 1]! in UYUM;
  if (k === 'dört') k = 'dörd';
  return unluyleBitiyor ? `${k}nc${u}` : `${k}${u}nc${u}`;
}

/**
 * Sıra sayısı: 1 -> birinci, 23 -> yirmi üçüncü, 1000 -> bininci.
 * Sadece negatif olmayan tam sayılar.
 */
export function siraSayisi(sayi: SayiGirdisi, secenekler: YazimSecenekleri = {}): string {
  const { eksi, tam, kesir } = ayir(sayi);
  if ((eksi && tam > 0n) || /[1-9]/.test(kesir)) {
    throw new RangeError(`Sıra sayısı için negatif olmayan tam sayı gerekiyor, gelen: ${String(sayi)}`);
  }
  const k = tamSayiKelimeleri(tam);
  k[k.length - 1] = siraEki(k[k.length - 1]!);
  return birlestir(k, secenekler, 'kucuk');
}
