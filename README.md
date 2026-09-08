# Üretken Yüz Kası Klavyesi

**Minimum kullanıcı etkileşimiyle güvenilir Türkçe cümle üreten, kişiselleştirilebilir kavram odaklı web-AAC sistemi.**

Genel erişilebilirlik ürünü: ALS ile sınırlı değil. Motor, konuşma veya yorgunluk kaynaklı yazma güçlüğünde anahtar kelimeler seçilir; cümle üretilir. Sistem tarayıcıda çalışır; yüz ağı cihazda kalır. Giriş hesabı yoktur.

---

## Bu projeyi diğerlerinden ayıran farklar

### 1. Harf değil, kavram — sıfır halüsinasyon

Kullanıcı `Su` ve `Soğuk` seçer. Model yalnızca bu kelimeleri dilbilgisine oturtur:

> Soğuk su istiyorum.

Seçilmeyen bilgi, duygu, sıcaklık veya zaman **uydurulmaz**. Varsayılan seçim yöntemi masseter (çiğneme kası) ile çene sıkmadır.

### 2. Agnostik LLM (çift motor)

`.env` içindeki `ACTIVE_LLM=gemini` veya `ACTIVE_LLM=openai` varsayılan motordur. Arayüzdeki **Gemini / OpenAI** anahtarı isteği anlık ezer (A/B).

| Motor | Model | Halüsinasyon kontrolü |
| --- | --- | --- |
| OpenAI | `gpt-4o-mini` | Structured Outputs (`json_schema`, `strict: true`) |
| Gemini | `gemini-2.0-flash` | `temperature: 0` + JSON schema |
| Yedek | yerel şablon | anahtar yoksa veya API düşerse |

### 3. İzole fail-safe (bilinçli örüntü)

Yüzdeki ağrı/kaş mimikleri **kullanılmaz**. Acil durum, iletişim ızgarasından ayrı bir servistir:

- Tetik: **6 saniye içinde art arda 3 uzun göz kırpma**
- Kısa kırpma yalnızca kelime seçer; uzun kırpma fail-safe’e gider
- 5 sn iptal penceresi (çene, Esc veya İPTAL); kısa kırpma iptal etmez
- Alarm sonrası: siren, isteğe bağlı tarayıcı bildirimi, bakıcı telefonu (`tel:`), sunucu webhook’u

SOS eşiği ayrıdır: ani göz kapağı yükselmesi veya uzun çene tutma. Eşikler bilinçli olarak düşürülmez.

### 4. Zamana duyarlı ve kişisel ızgara

Çekirdek satır sabittir. En fazla 8 bağlam kelimesi bakım panelinden seçilir; boş bırakılırsa sabah `Kahvaltı` / `Çay`, gece `Uyku` / `Işık` öne çıkar.

### 5. Odaklı kullanım ve bakım paneli

Oturum açıkken ekran uyanık kalır, tam ekran önerilir, sekme kapatılırken uyarı çıkar. Bakım paneli ad, telefon, kişisel kelimeler, sesli notlar ve yazdırılabilir günlük özeti tutar. İsimler klavyede görünmez.

---

## Canlı kullanım

```bash
npm install
# .env.local içine anahtarları yazın (örnek: .env.example)
npm run dev
```

[http://localhost:3000](http://localhost:3000) · [Dokümantasyon](http://localhost:3000/docs) · [Bakım ve Takip Paneli](http://localhost:3000/bakim-ve-takip-paneli)

Kamera yalnızca HTTPS veya localhost’ta, **ilk oturum protokolü onaylandıktan sonra** açılır.

Tarayıcı menüsünden ana ekrana eklenebilir; ayrı bir uygulama indirmeye gerek yoktur. Ağır bir service worker yoktur; MediaPipe ve kamera oturumunu bozmamak için bilinçli olarak eklenmedi.

## 45 saniyelik demo videosu

1. **0–8s** — Protokol listesi, ardından mesh; çene sıkma ile kelime seçimi.
2. **8–22s** — `Su` + `Soğuk` → sadık cümle (uydurma yok).
3. **22–32s** — EN ızgara + aynı kelimeler.
4. **32–45s** — Üç uzun kırpma (veya `E` `E` `E`) → izole acil katman; `Esc` ile iptal. SOS denemesi: `Shift+E`.

---

## Teknoloji yığını

| Katman | Seçim |
| --- | --- |
| Arayüz | Next.js + TypeScript |
| Görüntü | MediaPipe Face Landmarker (on-device) |
| Üretim | OpenAI Structured Outputs **veya** Gemini (`ACTIVE_LLM`) |
| Ses | Web Speech API |
| Fail-safe | 3 uzun kırpma / 6 sn, ızgaradan izole |
| Bakıcı bildirimi | Overlay + Notification + `tel:` + `CAREGIVER_WEBHOOK_URL` |
| Hosting | Vercel |

## Matematiksel motor (seçim)

Göz kapağı Öklid uzaklığı, yüz genişliğine oranlanır, min–max ölçeklenir. **Kısa** kırpma (açılış süresi &lt; 450 ms) seçer. **Uzun** kırpma yalnızca fail-safe sayacına gider. Varsayılan seçim çene sıkmadır.

Kaynak: `src/lib/vision/geometry.ts`, `blink-engine.ts`, `jaw-engine.ts`, `src/lib/safety/fail-safe-service.ts`.

## Klasör yapısı

```
src/
  app/api/generate     Agnostik LLM yönlendirici
  app/api/config       ACTIVE_LLM + anahtar + webhook varlığı
  app/api/emergency    Canlı uyarı + bakıcı webhook
  app/api/live-alert   Bakım paneli canlı SOS/alarm
  lib/llm/             openai (structured) · gemini · resolve
  lib/safety/          İzole fail-safe servisi
  lib/analytics.ts     Etkileşim + gecikme
  lib/prompts.ts       Sıfır halüsinasyon istemi
```

## Kullanım

| Girdi | Sonuç |
| --- | --- |
| Çene sıkma (önerilen) | Odak hücresini seçer |
| Kısa göz kırpma | Yalnızca kırpma modunda seçer |
| 3 uzun kırpma / 6 sn | İzole bakıcı çağrısı |
| Space | Kamerasız yedek tıklama |
| E | Bir uzun kırpma simülasyonu (demo) |
| Shift+E | SOS simülasyonu (demo) |
| Esc | Alarmı keser |
| Gemini / OpenAI | Anlık motor (A/B) |
| TR / EN | Izgara + istem + TTS |

## Ortam değişkenleri

```
ACTIVE_LLM=gemini          # veya openai
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
CAREGIVER_WEBHOOK_URL=
```

`CAREGIVER_WEBHOOK_URL` yalnızca sunucuda okunur; tarayıcıya verilmez. Vercel’de aynı adları Environment Variables’a ekleyin.

Aynı tarayıcıdaki bakım paneli canlı uyarıyı `BroadcastChannel` ve `/api/live-alert` ile görür (siren çalmaz). Uzak cihaz için webhook veya odadaki `Bakıcıyı ara` düğmesi kullanılır.

## Mülakat için tek cümle

> Minimum etkileşimle, seçilen kelimelerin dışına çıkmayan Türkçe cümle üretiyorum; motor Gemini veya OpenAI olabiliyor; acil durum ise iletişim ekranından ayrı, bilinçli üç uzun kırpma örüntüsü.
