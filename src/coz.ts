/**
 * Yazıdan sayıya. Çek, senet ya da faturada yazıyla yazılmış tutarın rakamla
 * uyuşup uyuşmadığını kontrol etmek için.
 *
 * Boşluklu ("bin iki yüz elli"), bitişik ("BinİkiYüzElli"), çerçeveli
 * ("#...#") ve "Yalnız ...dır" kalıbındaki metinleri okuyor.
 */

import { BIRLER, OLCEKLER, ONLAR } from './kelimeler';
import { PARALAR } from './paralar';
import { kucukHarf } from './yazim';

type Jeton =
  | { tur: 'birler'; deger: number }
  | { tur: 'onlar'; deger: number }
  | { tur: 'yuz' }
  | { tur: 'olcek'; us: number }
  | { tur: 'sifir' }
  | { tur: 'virgul' }
  | { tur: 'eksi' }
  | { tur: 'ana' }
  | { tur: 'alt' };

const SOZLUK = new Map<string, Jeton>();
BIRLER.forEach((k, i) => k && SOZLUK.set(k, { tur: 'birler', deger: i }));
ONLAR.forEach((k, i) => k && SOZLUK.set(k, { tur: 'onlar', deger: i }));
OLCEKLER.forEach((k, i) => k && SOZLUK.set(k, { tur: 'olcek', us: i }));
SOZLUK.set('yüz', { tur: 'yuz' });
SOZLUK.set('sıfır', { tur: 'sifir' });
SOZLUK.set('virgül', { tur: 'virgul' });
SOZLUK.set('eksi', { tur: 'eksi' });

// Para adlarının kelimeleri ve sık görülen başka yazımları
const ANA = new Set(['tl', 'lira', 'dolar', 'euro', 'yen']);
const ALT = new Set(['kr', 'krş']);
for (const p of Object.values(PARALAR)) {
  for (const k of kucukHarf(p.ana).split(' ')) ANA.add(k);
  for (const k of kucukHarf(p.alt).split(' ').filter(Boolean)) ALT.add(k);
}
for (const k of ANA) SOZLUK.set(k, { tur: 'ana' });
for (const k of ALT) SOZLUK.set(k, { tur: 'alt' });

// Uzun kelime önce denensin: "altmış" "altı"dan, "yetmiş" "yedi"den önce
const KELIMELER = [...SOZLUK.keys()].sort((a, b) => b.length - a.length);

const DIR_EKI = /(d|t)(ı|i|u|ü)r$/;

function temizle(metin: string): string {
  let m = kucukHarf(metin).replace(/[^a-zçğıöşü]+/g, ' ').trim();
  m = m.replace(/^yalnız\s*/, '');
  // "Kuruştur", "Lirasıdır": ek fiili at, kalan bilinen bir kelimeyse
  const sonKelime = /(\S+)$/.exec(m)?.[1] ?? '';
  const eksiz = sonKelime.replace(DIR_EKI, '');
  if (eksiz !== sonKelime && KELIMELER.some((k) => eksiz.endsWith(k))) {
    m = m.slice(0, m.length - sonKelime.length) + eksiz;
  }
  return m;
}

function jetonla(metin: string): Jeton[] {
  const birlesik = temizle(metin).replace(/\s+/g, '');
  if (!birlesik) throw new TypeError(`Sayı yazısı boş: "${metin}"`);
  const sonuc: Jeton[] = [];
  let i = 0;
  while (i < birlesik.length) {
    const k = KELIMELER.find((w) => birlesik.startsWith(w, i));
    if (!k) {
      throw new TypeError(`"${birlesik.slice(i, i + 12)}" kısmı anlaşılamadı: "${metin}"`);
    }
    sonuc.push(SOZLUK.get(k)!);
    i += k.length;
  }
  return sonuc;
}

/** Sayı jetonlarını bigint'e çevirir. Sıra hatalarını yakalıyor: "on on", "bin milyon" gibi. */
function topla(jetonlar: readonly Jeton[], metin: string): bigint {
  const hata = () => new TypeError(`Sayı yazısı kurala uymuyor: "${metin}"`);
  if (jetonlar.length === 0) throw hata();
  if (jetonlar.length === 1 && jetonlar[0]!.tur === 'sifir') return 0n;

  let toplam = 0n;
  let grup = 0n;
  let sonUs = Infinity;
  let yuz = false;
  let on = false;
  let bir = false;

  for (const j of jetonlar) {
    if (j.tur === 'birler') {
      if (bir) throw hata();
      grup += BigInt(j.deger);
      bir = true;
    } else if (j.tur === 'onlar') {
      if (on || bir) throw hata();
      grup += BigInt(j.deger * 10);
      on = true;
    } else if (j.tur === 'yuz') {
      if (yuz || on) throw hata();
      grup = (grup === 0n ? 1n : grup) * 100n;
      yuz = true;
      bir = false;
    } else if (j.tur === 'olcek') {
      if (j.us >= sonUs) throw hata();
      toplam += (grup === 0n ? 1n : grup) * 1000n ** BigInt(j.us);
      grup = 0n;
      sonUs = j.us;
      yuz = on = bir = false;
    } else {
      throw hata();
    }
  }
  return toplam + grup;
}

interface Okunan {
  eksi: boolean;
  tam: bigint;
  kesir: string;
}

function sayiOku(jetonlar: Jeton[], metin: string): Okunan {
  let eksi = false;
  if (jetonlar[0]?.tur === 'eksi') {
    eksi = true;
    jetonlar = jetonlar.slice(1);
  }
  const v = jetonlar.findIndex((j) => j.tur === 'virgul');
  if (v === -1) return { eksi, tam: topla(jetonlar, metin), kesir: '' };

  const tam = topla(jetonlar.slice(0, v), metin);
  let sonrasi = jetonlar.slice(v + 1);
  let sifirlar = 0;
  while (sonrasi.length > 1 && sonrasi[0]!.tur === 'sifir') {
    sifirlar++;
    sonrasi = sonrasi.slice(1);
  }
  const kesir = '0'.repeat(sifirlar) + topla(sonrasi, metin).toString();
  return { eksi, tam, kesir };
}

function sayiyaDonustur(o: Okunan, metin: string): number {
  if (o.tam > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`"${metin}" JavaScript sayısına sığmıyor, yazidanBigInt kullanın.`);
  }
  const n = Number(`${o.tam}${o.kesir ? `.${o.kesir}` : ''}`);
  return o.eksi && n !== 0 ? -n : n;
}

/**
 * Yazıyla sayıyı okur.
 *
 * yazidanSayiya('bin iki yüz elli')     // 1250
 * yazidanSayiya('üç virgül sıfır beş')  // 3.05
 */
export function yazidanSayiya(metin: string): number {
  const j = jetonla(metin);
  if (j.some((x) => x.tur === 'ana' || x.tur === 'alt')) {
    throw new TypeError(`Para birimi var, yazidanTutar kullanın: "${metin}"`);
  }
  return sayiyaDonustur(sayiOku(j, metin), metin);
}

/** Çok büyük tam sayılar için. Ondalık kabul etmiyor. */
export function yazidanBigInt(metin: string): bigint {
  const o = sayiOku(jetonla(metin), metin);
  if (o.kesir) throw new TypeError(`Ondalıklı sayı, yazidanSayiya kullanın: "${metin}"`);
  return o.eksi ? -o.tam : o.tam;
}

/**
 * Yazıyla tutarı okur. Para birimi adı ne olursa olsun ana ve alt birimi ayırıyor.
 *
 * yazidanTutar('Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş')  // 1250.75
 * yazidanTutar('#YalnızBinTürkLirasıdır#')                      // 1000
 */
export function yazidanTutar(metin: string, hane = 2): number {
  const jetonlar = jetonla(metin);
  let eksi = false;
  let i = 0;
  if (jetonlar[0]?.tur === 'eksi') {
    eksi = true;
    i = 1;
  }

  let ana = 0n;
  let alt = 0n;
  let birikim: Jeton[] = [];
  let anaGoruldu = false;
  let altGoruldu = false;

  for (; i <= jetonlar.length; i++) {
    const j = jetonlar[i];
    if (j && j.tur !== 'ana' && j.tur !== 'alt') {
      birikim.push(j);
      continue;
    }
    if (j?.tur === 'ana') {
      if (anaGoruldu && birikim.length) throw new TypeError(`Tutar yazısı kurala uymuyor: "${metin}"`);
      if (birikim.length) ana = topla(birikim, metin);
      anaGoruldu = true;
    } else if (j?.tur === 'alt') {
      if (altGoruldu) throw new TypeError(`Tutar yazısı kurala uymuyor: "${metin}"`);
      if (birikim.length) alt = topla(birikim, metin);
      altGoruldu = true;
    } else if (birikim.length) {
      // Sonda birimsiz sayı kaldı: ana birimden sonraysa alt, değilse ana
      if (anaGoruldu && !altGoruldu) alt = topla(birikim, metin);
      else if (!anaGoruldu) ana = topla(birikim, metin);
      else throw new TypeError(`Tutar yazısı kurala uymuyor: "${metin}"`);
    }
    birikim = [];
  }

  if (alt >= 10n ** BigInt(hane)) throw new RangeError(`Alt birim ${hane} haneyi aşıyor: "${metin}"`);
  const kesir = hane ? alt.toString().padStart(hane, '0') : '';
  return sayiyaDonustur({ eksi, tam: ana, kesir }, metin);
}
