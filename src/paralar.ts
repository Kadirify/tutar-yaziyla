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

export type ParaKodu = keyof typeof PARALAR;

export function paraBul(para: ParaKodu | Lowercase<ParaKodu> | ParaBirimi | undefined): ParaBirimi {
  if (para === undefined) return PARALAR.TRY;
  if (typeof para === 'string') {
    const p = (PARALAR as Record<string, ParaBirimi>)[para.toUpperCase()];
    if (!p) {
      throw new RangeError(
        `Bilinmeyen para birimi: ${para}. Desteklenenler: ${Object.keys(PARALAR).join(', ')}. ` +
          "Başka bir para için { ana: 'Kanada Doları', alt: 'Sent', hane: 2 } verin.",
      );
    }
    return p;
  }
  if (!Number.isInteger(para.hane) || para.hane < 0 || para.hane > 6) {
    throw new RangeError(`hane 0-6 arasında tam sayı olmalı, gelen: ${para.hane}`);
  }
  return para;
}
