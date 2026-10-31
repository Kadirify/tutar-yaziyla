import { ayir, type GirdiSecenekleri, type SayiGirdisi } from './girdi';
import { tamSayiKelimeleri } from './kelimeler';
import { paraBul, type ParaBirimi, type ParaKodu } from './paralar';
import { birlestir, dirEki, type YazimSecenekleri } from './yazim';

export interface TutarSecenekleri extends GirdiSecenekleri, YazimSecenekleri {
  /** 'TRY' (varsayılan), 'USD', 'EUR', 'GBP', 'CHF', 'JPY' ya da kendi tanımınız. */
  para?: ParaKodu | Lowercase<ParaKodu> | ParaBirimi;
  /**
   * Alt birimden fazla hane gelirse (1250,755 gibi) ne yapılsın.
   * 'yuvarla': yarım ve üstü yukarı (varsayılan). 'hata': RangeError.
   */
  fazlaHane?: 'yuvarla' | 'hata';
  /** Kuruş sıfırsa da yaz: "... Türk Lirası Sıfır Kuruş" */
  sifirKurus?: boolean;
  /** Lira sıfırsa da yaz: "Sıfır Türk Lirası Elli Kuruş" */
  sifirLira?: boolean;
  /** Faturadaki kalıp: "Yalnız Bin Türk Lirasıdır" */
  yalniz?: boolean;
}

export interface TutarParcalari {
  eksi: boolean;
  ana: bigint;
  /** Alt birim, yuvarlanmış: 75 kuruş için 75. */
  alt: number;
}

/** Tutarı ana ve alt birime ayırır, gerekiyorsa yuvarlar. */
export function tutarAyir(tutar: SayiGirdisi, s: TutarSecenekleri = {}): TutarParcalari {
  const { hane } = paraBul(s.para);
  const { eksi, tam, kesir } = ayir(tutar, s);
  const carpan = 10n ** BigInt(hane);

  const ilk = kesir.slice(0, hane).padEnd(hane, '0');
  const artan = kesir.slice(hane);
  let deger = tam * carpan + BigInt(ilk || '0');

  if (/[1-9]/.test(artan)) {
    if (s.fazlaHane === 'hata') {
      throw new RangeError(`Tutarda ${hane} haneden fazla ondalık var: ${String(tutar)}`);
    }
    // Yarım ve üstü yukarı. Metin üzerinden yapıyoruz, 1.005 gibi sayılar
    // kayan noktada 1.00499... olduğu için Math.round yanlış sonuç veriyor.
    if (Number(artan[0]) >= 5) deger += 1n;
  }

  const ana = deger / carpan;
  const alt = Number(deger % carpan);
  return { eksi: eksi && deger > 0n, ana, alt };
}

export function tutarKelimeleri(tutar: SayiGirdisi, s: TutarSecenekleri = {}): string[] {
  const para = paraBul(s.para);
  const { eksi, ana, alt } = tutarAyir(tutar, s);
  const anaAdi = para.ana.split(' ');
  const altAdi = para.alt ? para.alt.split(' ') : [];

  const k: string[] = [];
  if (eksi) k.push('eksi');

  const anaYaz = ana > 0n || s.sifirLira || alt === 0 || altAdi.length === 0;
  if (anaYaz) k.push(...tamSayiKelimeleri(ana), ...anaAdi);

  const altYaz = altAdi.length > 0 && (alt > 0 || s.sifirKurus);
  if (altYaz) k.push(...tamSayiKelimeleri(BigInt(alt)), ...altAdi);

  return k;
}

/**
 * Para tutarını yazıya çevirir. Fatura, makbuz, dekont için.
 *
 * tutarYaziyla(1250.75)        // 'Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş'
 * tutarYaziyla('₺1.250,75')    // aynısı
 * tutarYaziyla(99.9, { para: 'USD' })  // 'Doksan Dokuz ABD Doları Doksan Sent'
 */
export function tutarYaziyla(tutar: SayiGirdisi, secenekler: TutarSecenekleri = {}): string {
  const k = tutarKelimeleri(tutar, secenekler);
  if (secenekler.yalniz) {
    k.unshift('yalnız');
    k[k.length - 1] = dirEki(k[k.length - 1]!);
  }
  return birlestir(k, secenekler, 'baslik');
}
