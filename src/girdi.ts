/**
 * Girdiyi işaret, tam kısım ve ondalık rakamlar olarak ayırır.
 *
 * Kayan nokta hatası olmasın diye hiçbir yerde sayı aritmetiği yapmıyoruz;
 * tam kısım bigint, ondalık kısım rakam dizisi olarak taşınıyor.
 */

export type SayiGirdisi = number | bigint | string;

export interface GirdiSecenekleri {
  /**
   * Metin girdide ondalık ayırıcı. Verilmezse tahmin ediliyor:
   * ikisi birden varsa sondaki ondalıktır; tek nokta ve ardından tam üç
   * rakam varsa ("1.250") Türkçedeki gibi binlik ayırıcı sayılır.
   */
  ondalik?: ',' | '.';
}

export interface AyrikSayi {
  eksi: boolean;
  tam: bigint;
  /** Ondalık rakamlar, olduğu gibi ("05", "50"). Ondalık yoksa boş. */
  kesir: string;
}

function ussuAc(metin: string): string {
  // 1e-7, 1.5e+21 gibi gösterimleri düz rakama çevirir
  const m = /^(\d+)(?:\.(\d+))?e([+-]\d+)$/i.exec(metin);
  if (!m) return metin;
  const rakamlar = m[1]! + (m[2] ?? '');
  const nokta = m[1]!.length + Number(m[3]);
  if (nokta <= 0) return `0.${'0'.repeat(-nokta)}${rakamlar}`;
  if (nokta >= rakamlar.length) return rakamlar + '0'.repeat(nokta - rakamlar.length);
  return `${rakamlar.slice(0, nokta)}.${rakamlar.slice(nokta)}`;
}

function sayidan(n: number): string {
  if (!Number.isFinite(n)) throw new RangeError(`Sonlu bir sayı değil: ${n}`);
  if (Number.isInteger(n) && !Number.isSafeInteger(n)) {
    throw new RangeError(
      `${n} JavaScript sayısı olarak tam saklanamıyor, son basamakları bozulmuş olabilir. ` +
        'Büyük sayıları metin ("12345678901234567") ya da bigint (12345678901234567n) olarak verin.',
    );
  }
  return ussuAc(String(n));
}

function binlikKontrol(parcalar: string[], ham: string): void {
  // İlk grup 1-3 rakam ve sıfırla başlamaz, sonrakiler tam 3 rakam: "1.250.000" doğru, "12.50" yanlış
  if (parcalar.length < 2) return;
  const [ilk, ...diger] = parcalar;
  if (!/^[1-9]\d{0,2}$/.test(ilk!) || !diger.every((p) => /^\d{3}$/.test(p))) {
    throw new RangeError(`Binlik ayırıcılar yanlış yerde: "${ham}"`);
  }
}

function metinden(ham: string, s: GirdiSecenekleri): { eksi: boolean; duz: string } {
  let m = ham
    .trim()
    .replace(/[\s  ']/g, '')
    .replace(/^(₺|TL|TRY)|(₺|TL|TRY|TL\.)$/gi, '');
  let eksi = false;
  if (/^[-−]/.test(m)) {
    eksi = true;
    m = m.slice(1);
  } else if (m.startsWith('+')) {
    m = m.slice(1);
  }
  if (!/^[\d.,]+$/.test(m) || !/\d/.test(m)) {
    throw new TypeError(`Sayı olarak okunamadı: "${ham}"`);
  }

  const virgul = m.includes(',');
  const nokta = m.includes('.');
  let ondalik: ',' | '.' | undefined = s.ondalik;
  if (!ondalik) {
    if (virgul && nokta) ondalik = m.lastIndexOf(',') > m.lastIndexOf('.') ? ',' : '.';
    else if (virgul) ondalik = (m.match(/,/g)?.length ?? 0) > 1 ? '.' : ',';
    else if (nokta) ondalik = (m.match(/\./g)?.length ?? 0) > 1 || /^[1-9]\d{0,2}\.\d{3}$/.test(m) ? ',' : '.';
    else ondalik = ',';
  }
  const binlik = ondalik === ',' ? '.' : ',';

  const [tamKisim = '', kesir, fazla] = m.split(ondalik);
  if (fazla !== undefined) throw new RangeError(`Birden fazla ondalık ayırıcı var: "${ham}"`);
  binlikKontrol(tamKisim.split(binlik), ham);
  if (kesir !== undefined && (kesir.includes(binlik) || kesir === '')) {
    throw new RangeError(`Ondalık kısım okunamadı: "${ham}"`);
  }
  return { eksi, duz: tamKisim.split(binlik).join('') + (kesir !== undefined ? `.${kesir}` : '') };
}

export function ayir(girdi: SayiGirdisi, s: GirdiSecenekleri = {}): AyrikSayi {
  let eksi = false;
  let duz: string;

  if (typeof girdi === 'bigint') {
    eksi = girdi < 0n;
    duz = (eksi ? -girdi : girdi).toString();
  } else if (typeof girdi === 'number') {
    eksi = girdi < 0 || Object.is(girdi, -0);
    duz = sayidan(Math.abs(girdi));
  } else if (typeof girdi === 'string') {
    ({ eksi, duz } = metinden(girdi, s));
  } else {
    throw new TypeError(`Sayı, bigint ya da metin bekleniyordu, gelen: ${typeof girdi}`);
  }

  const [tam = '0', kesir = ''] = duz.split('.');
  return { eksi, tam: BigInt(tam || '0'), kesir };
}
