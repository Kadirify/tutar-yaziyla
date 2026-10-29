import { ayir, type GirdiSecenekleri, type SayiGirdisi } from './girdi';
import { tamSayiKelimeleri } from './kelimeler';

export type YaziSecenekleri = GirdiSecenekleri;

/** Sayının kelimeleri. Ondalık kısım "virgül"den sonra okunuyor: 3,05 -> üç virgül sıfır beş */
export function sayiKelimeleri(sayi: SayiGirdisi, s: GirdiSecenekleri = {}): string[] {
  const { eksi, tam, kesir } = ayir(sayi, s);
  const anlamli = kesir.replace(/0+$/, '') === '' ? '' : kesir;
  const k: string[] = [];
  if (eksi && (tam > 0n || anlamli)) k.push('eksi');
  k.push(...tamSayiKelimeleri(tam));
  if (anlamli) {
    k.push('virgül');
    const bastakiSifir = /^0*/.exec(anlamli)![0].length;
    for (let i = 0; i < bastakiSifir; i++) k.push('sıfır');
    k.push(...tamSayiKelimeleri(BigInt(anlamli.slice(bastakiSifir))));
  }
  return k;
}

/**
 * Sayıyı Türkçe yazıya çevirir.
 *
 * yaziyla(1250)      // 'bin iki yüz elli'
 * yaziyla('3,05')    // 'üç virgül sıfır beş'
 * yaziyla(-40)       // 'eksi kırk'
 */
export function yaziyla(sayi: SayiGirdisi, secenekler: YaziSecenekleri = {}): string {
  return sayiKelimeleri(sayi, secenekler).join(' ');
}
