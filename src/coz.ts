/**
 * Yazıdan sayıya. Çek, senet ya da faturada yazıyla yazılmış tutarın rakamla
 * uyuşup uyuşmadığını kontrol etmek için.
 *
 * Boşluklu ("bin iki yüz elli"), bitişik ("BinİkiYüzElli"), çerçeveli
 * ("#...#"), "Yalnız ...dır" kalıbındaki ve Türkçe karaktersiz ("iki yuz")
 * metinleri okuyor.
 */

import { BIRLER, OLCEKLER, ONLAR } from './kelimeler';
import { kucukHarf } from './yazim';

export interface CozSecenekleri {
  /**
   * "bir bin", "bir yüz", tek başına "milyon" gibi yazımları da kabul et.
   * Varsayılan olarak bunlar hata veriyor, çünkü doğru yazılmış bir çekte olmazlar.
   */
  esnek?: boolean;
}

export interface TutarCozSecenekleri extends CozSecenekleri {
  /** Alt birim kaç hane. Varsayılan 2. */
  hane?: number;
}

type Jeton =
  | { tur: 'birler'; deger: number }
  | { tur: 'onlar'; deger: number }
  | { tur: 'yuz' }
  | { tur: 'olcek'; us: number }
  | { tur: 'sifir' }
  | { tur: 'virgul' }
  | { tur: 'eksi' }
  | { tur: 'ana'; kod: string }
  | { tur: 'alt'; kodlar: string[] };

/** Küçük harfe çevirip Türkçe karakterleri düzleştirir: "İKİ YÜZ" -> "iki yuz" */
function duzle(s: string): string {
  return kucukHarf(s)
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');
}

// Para adları ve sık kullanılan kısa yazımlar. Çok kelimeli adlar tek parça
// tutuluyor ki "Lira Türk" gibi bozuk sıralar kabul edilmesin.
const PARA_ADLARI: Record<string, { ana: string[]; alt: string[] }> = {
  TRY: { ana: ['Türk Lirası', 'lira', 'TL'], alt: ['Kuruş', 'kr', 'krş'] },
  USD: { ana: ['ABD Doları', 'Amerikan Doları', 'dolar'], alt: ['Sent'] },
  EUR: { ana: ['Avro', 'euro'], alt: ['Sent'] },
  GBP: { ana: ['İngiliz Sterlini', 'sterlin'], alt: ['Peni'] },
  CHF: { ana: ['İsviçre Frangı', 'frank'], alt: ['Santim'] },
  JPY: { ana: ['Japon Yeni', 'yen'], alt: [] },
};

const SOZLUK = new Map<string, Jeton>();
const ekle = (k: string, j: Jeton) => SOZLUK.set(duzle(k).replace(/\s+/g, ''), j);
BIRLER.forEach((k, i) => k && ekle(k, { tur: 'birler', deger: i }));
ONLAR.forEach((k, i) => k && ekle(k, { tur: 'onlar', deger: i }));
OLCEKLER.forEach((k, i) => k && ekle(k, { tur: 'olcek', us: i }));
ekle('yüz', { tur: 'yuz' });
ekle('sıfır', { tur: 'sifir' });
ekle('virgül', { tur: 'virgul' });
ekle('eksi', { tur: 'eksi' });

const altKodlari = new Map<string, string[]>();
for (const [kod, { ana, alt }] of Object.entries(PARA_ADLARI)) {
  for (const a of ana) ekle(a, { tur: 'ana', kod });
  for (const a of alt) {
    const anahtar = duzle(a);
    altKodlari.set(anahtar, [...(altKodlari.get(anahtar) ?? []), kod]);
  }
}
for (const [anahtar, kodlar] of altKodlari) SOZLUK.set(anahtar, { tur: 'alt', kodlar });

// Uzun kelime önce denensin: "altmis" "alti"dan, "yetmis" "yedi"den önce
const KELIMELER = [...SOZLUK.keys()].sort((a, b) => b.length - a.length);

function temizle(metin: string): { eksi: boolean; govde: string } {
  if (/\d/.test(metin)) {
    throw new TypeError(`Rakam var: "${metin}". Bu fonksiyon yazıyla yazılmış sayıyı okur.`);
  }
  // TL'dir, Euro'dur
  let m = metin.replace(/['’][dt][ıiuü]r\b/gi, '');
  const eksi = /^[^a-zA-ZçğıöşüÇĞİÖŞÜ]*[-−]/.test(m);
  m = duzle(m).replace(/[^a-z]+/g, ' ').trim();
  let govde = m.replace(/^yalniz\s*/, '').replace(/\s+/g, '');
  // Kuruştur, Lirasıdır: ek fiili at, kalan bilinen bir kelimeyle bitiyorsa
  const eksiz = govde.replace(/[dt][iu]r$/, '');
  if (eksiz !== govde && KELIMELER.some((k) => eksiz.endsWith(k))) govde = eksiz;
  return { eksi, govde };
}

function jetonla(metin: string): Jeton[] {
  const { eksi, govde } = temizle(metin);
  if (!govde) throw new TypeError(`Sayı yazısı boş: "${metin}"`);
  const sonuc: Jeton[] = eksi ? [{ tur: 'eksi' }] : [];
  let i = 0;
  while (i < govde.length) {
    const k = KELIMELER.find((w) => govde.startsWith(w, i));
    if (!k) throw new TypeError(`"${govde.slice(i, i + 12)}" kısmı anlaşılamadı: "${metin}"`);
    sonuc.push(SOZLUK.get(k)!);
    i += k.length;
  }
  return sonuc;
}

/** Sayı jetonlarını bigint'e çevirir. "on on", "bin milyon" gibi sıra hatalarını yakalıyor. */
function topla(jetonlar: readonly Jeton[], metin: string, s: CozSecenekleri): bigint {
  const hata = (neden = 'kurala uymuyor') => new TypeError(`Sayı yazısı ${neden}: "${metin}"`);
  if (jetonlar.length === 0) throw hata('eksik');
  if (jetonlar.length === 1 && jetonlar[0]!.tur === 'sifir') return 0n;

  let toplam = 0n;
  let grup = 0n;
  let sonUs = Infinity;
  let yuz = false;
  let on = false;
  let bir = false;
  let tekBir = false;

  for (const j of jetonlar) {
    if (j.tur === 'birler') {
      if (bir) throw hata();
      tekBir = j.deger === 1 && grup === 0n;
      grup += BigInt(j.deger);
      bir = true;
    } else if (j.tur === 'onlar') {
      if (on || bir) throw hata();
      grup += BigInt(j.deger * 10);
      on = true;
      tekBir = false;
    } else if (j.tur === 'yuz') {
      if (yuz || on) throw hata();
      if (tekBir && !s.esnek) throw hata('"bir yüz" değil "yüz" olmalı');
      grup = (grup === 0n ? 1n : grup) * 100n;
      yuz = true;
      bir = tekBir = false;
    } else if (j.tur === 'olcek') {
      if (j.us >= sonUs) throw hata();
      if (!s.esnek) {
        if (j.us === 1 && tekBir && grup === 1n) throw hata('"bir bin" değil "bin" olmalı');
        if (j.us > 1 && grup === 0n) throw hata(`"${OLCEKLER[j.us]}" önünde sayı yok`);
      }
      toplam += (grup === 0n ? 1n : grup) * 1000n ** BigInt(j.us);
      grup = 0n;
      sonUs = j.us;
      yuz = on = bir = tekBir = false;
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

function sayiOku(jetonlar: Jeton[], metin: string, s: CozSecenekleri): Okunan {
  let eksi = false;
  if (jetonlar[0]?.tur === 'eksi') {
    eksi = true;
    jetonlar = jetonlar.slice(1);
  }
  const v = jetonlar.findIndex((j) => j.tur === 'virgul');
  if (v === -1) return { eksi, tam: topla(jetonlar, metin, s), kesir: '' };

  const tam = topla(jetonlar.slice(0, v), metin, s);
  let sonrasi = jetonlar.slice(v + 1);
  let sifirlar = 0;
  while (sonrasi.length > 1 && sonrasi[0]!.tur === 'sifir') {
    sifirlar++;
    sonrasi = sonrasi.slice(1);
  }
  return { eksi, tam, kesir: '0'.repeat(sifirlar) + topla(sonrasi, metin, s).toString() };
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
export function yazidanSayiya(metin: string, secenekler: CozSecenekleri = {}): number {
  const j = jetonla(metin);
  if (j.some((x) => x.tur === 'ana' || x.tur === 'alt')) {
    throw new TypeError(`Para birimi var, yazidanTutar kullanın: "${metin}"`);
  }
  return sayiyaDonustur(sayiOku(j, metin, secenekler), metin);
}

/** Çok büyük tam sayılar için. Ondalık kabul etmiyor. */
export function yazidanBigInt(metin: string, secenekler: CozSecenekleri = {}): bigint {
  const o = sayiOku(jetonla(metin), metin, secenekler);
  if (o.kesir) throw new TypeError(`Ondalıklı sayı, yazidanSayiya kullanın: "${metin}"`);
  return o.eksi ? -o.tam : o.tam;
}

/**
 * Yazıyla tutarı okur.
 *
 * yazidanTutar('Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş')  // 1250.75
 * yazidanTutar('#YalnızBinTürkLirasıdır#')                      // 1000
 */
export function yazidanTutar(metin: string, secenekler: TutarCozSecenekleri = {}): number {
  const hane = secenekler.hane ?? 2;
  const hata = (neden: string) => new TypeError(`Tutar yazısı ${neden}: "${metin}"`);
  const jetonlar = jetonla(metin);
  let i = 0;
  const eksi = jetonlar[0]?.tur === 'eksi';
  if (eksi) i = 1;

  let ana: bigint | undefined;
  let alt: bigint | undefined;
  let anaKod: string | undefined;
  let altKodlar: string[] | undefined;
  let birikim: Jeton[] = [];

  for (; i <= jetonlar.length; i++) {
    const j = jetonlar[i];
    if (j && j.tur !== 'ana' && j.tur !== 'alt') {
      birikim.push(j);
      continue;
    }
    const sayi = birikim.length ? topla(birikim, metin, secenekler) : undefined;
    birikim = [];
    if (j?.tur === 'ana') {
      if (anaKod || altKodlar) throw hata('kurala uymuyor');
      if (sayi === undefined && !secenekler.esnek) throw hata('para biriminden önce sayı yok');
      anaKod = j.kod;
      ana = sayi ?? 1n;
    } else if (j?.tur === 'alt') {
      if (altKodlar) throw hata('kurala uymuyor');
      if (sayi === undefined) throw hata('alt birimden önce sayı yok');
      altKodlar = j.kodlar;
      alt = sayi;
    } else if (sayi !== undefined) {
      // Sonda birimsiz sayı kaldı: ana birimden sonraysa alt, değilse ana
      if (anaKod && !altKodlar) alt = sayi;
      else if (!anaKod && !altKodlar) ana = sayi;
      else throw hata('kurala uymuyor');
    }
  }

  if (ana === undefined && alt === undefined) throw hata('sayı içermiyor');
  if (anaKod && altKodlar && !altKodlar.includes(anaKod)) throw hata('iki farklı para birimi içeriyor');
  if ((alt ?? 0n) >= 10n ** BigInt(hane)) throw new RangeError(`Alt birim ${hane} haneyi aşıyor: "${metin}"`);
  const kesir = hane ? (alt ?? 0n).toString().padStart(hane, '0') : '';
  return sayiyaDonustur({ eksi, tam: ana ?? 0n, kesir }, metin);
}
