export interface ParaBirimi {
  /** Ana birimin adı: 'Türk Lirası' */
  ana: string;
  /** Alt birimin adı: 'Kuruş'. Alt birimi olmayan para için boş. */
  alt: string;
  /** Alt birim kaç hane: kuruş için 2. */
  hane: number;
}

// Adlar TCMB kur listesindeki Türkçe karşılıklar
export const PARALAR = {
  TRY: { ana: 'Türk Lirası', alt: 'Kuruş', hane: 2 },
  USD: { ana: 'ABD Doları', alt: 'Sent', hane: 2 },
  EUR: { ana: 'Avro', alt: 'Sent', hane: 2 },
  GBP: { ana: 'İngiliz Sterlini', alt: 'Peni', hane: 2 },
  CHF: { ana: 'İsviçre Frangı', alt: 'Santim', hane: 2 },
  JPY: { ana: 'Japon Yeni', alt: '', hane: 0 },
} as const satisfies Record<string, ParaBirimi>;

export type ParaKodu = keyof typeof PARALAR | 'TL';

export function paraBul(para: ParaKodu | Lowercase<ParaKodu> | ParaBirimi | undefined): ParaBirimi {
  if (para === undefined) return PARALAR.TRY;
  if (typeof para === 'string') {
    const kod = para.toUpperCase() === 'TL' ? 'TRY' : para.toUpperCase();
    const p = (PARALAR as Record<string, ParaBirimi>)[kod];
    if (!p) throw new RangeError(`Bilinmeyen para birimi: ${para} (${Object.keys(PARALAR).join(', ')})`);
    return p;
  }
  if (!Number.isInteger(para.hane) || para.hane < 0 || para.hane > 6) {
    throw new RangeError(`hane 0-6 arasında tam sayı olmalı, gelen: ${para.hane}`);
  }
  // alt birimi yoksa kesir kaybolur
  if (!para.alt && para.hane > 0) throw new RangeError(`"${para.ana}" için alt birim adı yok, hane 0 olmalı`);
  return para;
}
