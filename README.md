# tutar-yaziyla

[![npm](https://img.shields.io/npm/v/tutar-yaziyla)](https://www.npmjs.com/package/tutar-yaziyla)
[![CI](https://github.com/Kadirify/tutar-yaziyla/actions/workflows/ci.yml/badge.svg)](https://github.com/Kadirify/tutar-yaziyla/actions/workflows/ci.yml)

Sayıları ve para tutarlarını Türkçe yazıya çevirir. Fatura, makbuz, dekont, çek ve senet için.
Tersini de yapar: yazıyla yazılmış tutarı rakama çevirir.

```js
import { tutarYaziyla } from 'tutar-yaziyla';

tutarYaziyla(1250.75);
// 'Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş'
```

```
npm install tutar-yaziyla
```

Bağımlılığı yok. Node 20 ve üstü, ESM ve CommonJS.

## Tutar

```js
tutarYaziyla(1250.75);           // 'Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş'
tutarYaziyla('1.250,75');        // aynısı
tutarYaziyla('₺12.500.000');     // 'On İki Milyon Beş Yüz Bin Türk Lirası'
tutarYaziyla(0.5);               // 'Elli Kuruş'
tutarYaziyla(49.99, { para: 'EUR' });  // 'Kırk Dokuz Avro Doksan Dokuz Sent'
```

Faturadaki kalıp:

```js
tutarYaziyla(1250.75, { yalniz: true });
// 'Yalnız Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruştur'
```

Çek ve senette araya kelime eklenemesin diye bitişik yazılır:

```js
tutarYaziyla(1250.75, { bitisik: true, cerceve: '#' });
// '#BinİkiYüzElliTürkLirasıYetmişBeşKuruş#'

tutarYaziyla(1250.75, { harf: 'buyuk', bitisik: true, cerceve: '***' });
// '***BİNİKİYÜZELLİTÜRKLİRASIYETMİŞBEŞKURUŞ***'
```

| Seçenek | Değerler | Varsayılan |
|---|---|---|
| `para` | `'TRY'` (ya da `'TL'`), `'USD'`, `'EUR'`, `'GBP'`, `'CHF'`, `'JPY'` ya da `{ ana, alt, hane }` | `'TRY'` |
| `harf` | `'baslik'`, `'kucuk'`, `'buyuk'`, `'cumle'` | `'baslik'` |
| `bitisik` | boşluksuz yaz | `false` |
| `cerceve` | başa ve sona konacak işaret | yok |
| `yalniz` | "Yalnız ... -dır" kalıbı | `false` |
| `sifirKurus` | "Bin Türk Lirası Sıfır Kuruş" | `false` |
| `sifirLira` | "Sıfır Türk Lirası Elli Kuruş" | `false` |
| `fazlaHane` | kuruştan fazla hane gelirse `'yuvarla'` ya da `'hata'` | `'yuvarla'` |
| `ondalik` | metin girdide ondalık ayırıcı, `','` ya da `'.'` | tahmin |

Listede olmayan bir para için:

```js
tutarYaziyla(5, { para: { ana: 'Kanada Doları', alt: 'Sent', hane: 2 } });
```

## Sayı ve sıra sayısı

```js
import { yaziyla, siraSayisi } from 'tutar-yaziyla';

yaziyla(2026);       // 'iki bin yirmi altı'
yaziyla(101000);     // 'yüz bir bin'
yaziyla('3,05');     // 'üç virgül sıfır beş'
yaziyla(-40);        // 'eksi kırk'

siraSayisi(4);       // 'dördüncü'
siraSayisi(2026);    // 'iki bin yirmi altıncı'
```

İkisi de varsayılan olarak küçük harf yazıyor. `harf`, `bitisik` ve `cerceve` burada da geçerli.

## Yazıdan rakama

Çekteki yazıyla rakamın tutup tutmadığını kontrol etmek için:

```js
import { yazidanTutar, yazidanSayiya } from 'tutar-yaziyla';

yazidanTutar('#BinİkiYüzElliTürkLirasıYetmişBeşKuruş#');  // 1250.75
yazidanTutar('Yalnız Bin Türk Lirasıdır');                // 1000
yazidanSayiya('yüz bir bin');                             // 101000
```

Boşluklu, bitişik, büyük harfli, çerçeveli ve Türkçe karaktersiz ("iki yuz elli") yazıları,
"TL'dir" gibi ekleri okuyor. Rakam karışmış yazıda ("5 milyon lira"), "on on" ya da "bir bin"
gibi doğru yazılmış bir çekte olmayacak şeylerde ve iki farklı para birimi geçince hata veriyor.
"bir bin" gibi yazımları kabul etmesi için `{ esnek: true }`.

## Girdi

Sayı, bigint ya da metin verebilirsiniz. Metinde `1.250,75`, `1,250.75`, `1250,75`, `₺1.250,75`
ve `1.250,75 TL` okunuyor. Tek nokta ve ardından tam üç rakam varsa (`'1.250'`) Türkçedeki gibi
binlik sayılıyor, yani 1250. Veri İngilizce biçimde geliyorsa `{ ondalik: '.' }` verin.

9 katrilyonun üstündeki tam sayılar JavaScript sayısında bozulduğu için hata veriyor; onları
metin ya da bigint olarak verin. Septilyona kadar (27 basamak) gidiyor.

## Kuruş yuvarlama

Kuruştan fazla hane gelirse yarım ve üstü yukarı yuvarlanıyor. Yuvarlama metin üzerinden yapılıyor;
kayan noktada `(1.005).toFixed(2)` sonucu `'1.00'` çıkıyor, burada `1,01`. Fazla haneyi kabul
etmek istemiyorsanız `{ fazlaHane: 'hata' }`.

Yuvarlanmış parçaları ayrı almak için `tutarAyir(1250.755)`, sonuç
`{ eksi: false, ana: 1250n, alt: 76 }`. `ana` bigint, JSON'a yazacaksanız önce `String()` ile çevirin.

## Yazım

"Bir yüz", "bir bin" yazılmıyor ama "bir milyon", "yüz bir bin" yazılıyor. Büyük harfte `İKİ`
çıkıyor, `IKI` değil. Cümle düzeninde "Türk lirası", "İngiliz sterlini" gibi özel adlar büyük
kalıyor, ABD ve TL gibi kısaltmalar hiç değişmiyor. "Yalnız" kalıbındaki ek ünlü uyumuna göre
geliyor: Kuruştur, Lirasıdır, Avrodur, TL'dir. Eksi tutarla "Yalnız" kullanılamıyor.

## Komut satırı

```
npx tutar-yaziyla 1.250,75
npx tutar-yaziyla 1250.75 --bitisik --cerceve=#
npx tutar-yaziyla --sayi 2026
npx tutar-yaziyla --sira 100
npx tutar-yaziyla "Bin İki Yüz Elli Türk Lirası Yetmiş Beş Kuruş"
```

Diğer seçenekler için `npx tutar-yaziyla --help`.

## Lisans

MIT
