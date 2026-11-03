import { yazidanSayiya, yazidanTutar } from './coz';
import { PARALAR, type ParaKodu } from './paralar';
import { siraSayisi } from './sira';
import { tutarYaziyla } from './tutar';
import type { Harf } from './yazim';
import { yaziyla } from './yaziyla';

declare const __SURUM__: string | undefined;

export interface CliSonucu {
  cikti: string;
  kod: number;
}

const YARDIM = `tutar-yaziyla - sayıları ve tutarları Türkçe yazıya çevirir

Kullanım:
  tutar-yaziyla <tutar>            tutarı yazıya çevirir (varsayılan TL)
  tutar-yaziyla --sayi <sayı>      düz sayı olarak: bin iki yüz elli
  tutar-yaziyla --sira <sayı>      sıra sayısı: yüzüncü
  tutar-yaziyla "<yazı>"           yazıyı rakama çevirir (harf içeriyorsa kendiliğinden)

Seçenekler:
  --para=USD       para birimi (${Object.keys(PARALAR).join(', ')})
  --bitisik        boşluksuz yaz (çek, senet)
  --cerceve=#      başa ve sona işaret koy
  --yalniz         "Yalnız ... Kuruştur" kalıbı
  --buyuk, --kucuk, --cumle   harf düzeni (varsayılan başlık)
  -v, --version    sürüm
  -h, --help       bu yardım

Örnekler:
  npx tutar-yaziyla 1.250,75
  npx tutar-yaziyla 1250.75 --bitisik --cerceve=#
  npx tutar-yaziyla "Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş"`;

export function calistir(argv: readonly string[]): CliSonucu {
  let kip: 'tutar' | 'sayi' | 'sira' = 'tutar';
  let harf: Harf | undefined;
  let bitisik = false;
  let yalniz = false;
  let cerceve: string | undefined;
  let para: string | undefined;
  const konumsal: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    let [ad, deger] = a.startsWith('--') ? (a.split('=', 2) as [string, string?]) : [a, undefined];
    // --para USD de --para=USD gibi çalışsın
    if (ad === '--para' && deger === undefined) deger = argv[++i];
    switch (ad) {
      case '-h':
      case '--help':
        return { cikti: YARDIM, kod: 0 };
      case '-v':
      case '--version':
        return { cikti: typeof __SURUM__ === 'string' ? __SURUM__ : 'geliştirme', kod: 0 };
      case '--sayi':
        kip = 'sayi';
        break;
      case '--sira':
        kip = 'sira';
        break;
      case '--bitisik':
        bitisik = true;
        break;
      case '--yalniz':
        yalniz = true;
        break;
      case '--buyuk':
        harf = 'buyuk';
        break;
      case '--kucuk':
        harf = 'kucuk';
        break;
      case '--cumle':
        harf = 'cumle';
        break;
      case '--cerceve':
        cerceve = deger ?? '#';
        break;
      case '--para':
        para = deger;
        break;
      default:
        if (ad.startsWith('--')) return { cikti: `Bilinmeyen seçenek: ${ad}\n\n${YARDIM}`, kod: 2 };
        konumsal.push(a);
    }
  }

  const girdi = konumsal.join(' ').trim();
  if (!girdi) return { cikti: YARDIM, kod: 2 };

  try {
    // Harf varsa yazıdan rakama
    if (/[a-zçğıöşü]/i.test(girdi.replace(/^[₺$€£]|\s*(TL|TRY)$/gi, ''))) {
      const tutarMi = /lira|tl|kuruş|kr|dolar|sent|avro|euro|sterlin|peni|frang|santim|yen/i.test(girdi);
      const n = tutarMi ? yazidanTutar(girdi) : yazidanSayiya(girdi);
      return { cikti: tutarMi ? n.toFixed(2) : String(n), kod: 0 };
    }

    const yazim = { harf, bitisik, cerceve };
    if (kip === 'sayi') return { cikti: yaziyla(girdi, yazim), kod: 0 };
    if (kip === 'sira') return { cikti: siraSayisi(girdi, yazim), kod: 0 };
    return { cikti: tutarYaziyla(girdi, { ...yazim, yalniz, para: para as ParaKodu | undefined }), kod: 0 };
  } catch (e) {
    if (e instanceof RangeError || e instanceof TypeError) return { cikti: `Hata: ${e.message}`, kod: 1 };
    throw e;
  }
}
