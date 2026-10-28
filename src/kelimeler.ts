export const BIRLER = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'] as const;
export const ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'] as const;

/** Üçlü basamak grupları. Kısa ölçek: her biri öncekinin bin katı. */
export const OLCEKLER = [
  '',
  'bin',
  'milyon',
  'milyar',
  'trilyon',
  'katrilyon',
  'kentilyon',
  'seksilyon',
  'septilyon',
] as const;

/** Desteklenen en büyük sayıdan bir fazlası: 10^27 */
export const SINIR = 10n ** BigInt(OLCEKLER.length * 3);

/** 0-999 arası bir grubu kelimelere ayırır. 0 için boş dizi. */
export function grupKelimeleri(n: number): string[] {
  const yuz = Math.floor(n / 100);
  const on = Math.floor((n % 100) / 10);
  const bir = n % 10;
  const k: string[] = [];
  // "bir yüz" denmez, sadece "yüz"
  if (yuz > 1) k.push(BIRLER[yuz]!);
  if (yuz > 0) k.push('yüz');
  if (on > 0) k.push(ONLAR[on]!);
  if (bir > 0) k.push(BIRLER[bir]!);
  return k;
}

/**
 * Negatif olmayan tam sayının kelimeleri, sırayla.
 * Birleştirme (boşluklu ya da bitişik) ve harf düzeni çağırana kalıyor.
 */
export function tamSayiKelimeleri(n: bigint): string[] {
  if (n < 0n) throw new RangeError('Negatif sayı buraya gelmemeli');
  if (n >= SINIR) {
    throw new RangeError(`En fazla ${OLCEKLER.length * 3} basamaklı sayılar destekleniyor (septilyon).`);
  }
  if (n === 0n) return ['sıfır'];

  const gruplar: number[] = [];
  for (let kalan = n; kalan > 0n; kalan /= 1000n) gruplar.push(Number(kalan % 1000n));

  const k: string[] = [];
  for (let i = gruplar.length - 1; i >= 0; i--) {
    const g = gruplar[i]!;
    if (g === 0) continue;
    // "bir bin" denmez, "bin" denir; ama "bir milyon", "yüz bir bin" doğru
    if (!(i === 1 && g === 1)) k.push(...grupKelimeleri(g));
    if (i > 0) k.push(OLCEKLER[i]!);
  }
  return k;
}
