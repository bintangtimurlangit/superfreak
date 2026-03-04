# API Ongkir Indonesia – Sekarang Pakai Biteship

**Status:** Checkout shipping cost sekarang memakai **Biteship** (bukan RajaOngkir/Komerce).  
Env: `BITESHIP_API_KEY`. Origin/destination pakai **kode pos** (Warehouse Postal Code di Payload + alamat customer).

---

# Rekomendasi API Ongkir Indonesia (Alternatif RajaOngkir/Komerce)

Karena RajaOngkir via Komerce sering return 400 (Invalid Api key / akses bermasalah), berikut opsi API cek ongkir lain yang bisa dipakai.

---

## 1. **Biteship** (Rekomendasi utama)

- **Situs:** https://biteship.com  
- **Dokumentasi:** https://biteship.com/id/docs/api/rates/overview  
- **Fitur:** Cek tarif multi-kurir (JNE, J&T, SiCepat, dll), support **area ID**, **kode pos**, atau **koordinat**.  
- **Auth:** API key dari dashboard (https://dashboard.biteship.com/integrations), ada sandbox untuk testing.  
- **Endpoint utama:** `POST /v1/rates/couriers` (body: origin, destination, weight, courier, dll).  
- **Cocok untuk:** Aplikasi e‑commerce / checkout yang butuh hitung ongkir real-time.

**Integrasi:** Perlu ganti layer di backend (env key, base URL, format request/response) karena format beda dengan RajaOngkir.

---

## 2. **Shipper (shipper.id)**

- **Situs:** https://shipper.id  
- **Dokumentasi:** https://logistics-docs.shipper.id (Pricing, Domestic Pricing, dll).  
- **Fitur:** Cek tarif, pickup, generate label, tracking; satu integrasi ke banyak kurir.  
- **Pricing:** Ada setup fee (sekitar Rp 1.500.000) untuk akses API.  
- **Cocok untuk:** Kalau butuh tidak cuma ongkir tapi juga order pengiriman, label, dan tracking terintegrasi.

---

## 3. **RajaOngkir langsung (rajaongkir.com)**

- **Situs / docs:** https://www.rajaongkir.com/docs  
- **Catatan:** Ada tier **Starter (gratis, ~100 hit/hari)** dan **Pro** (berbayar, kuota lebih besar).  
- **Base URL:** Cek di dokumentasi resmi; ada kemungkinan beda dengan `rajaongkir.komerce.id` (Komerce adalah partner/white-label).  
- **Cocok untuk:** Tetap pakai ekosistem RajaOngkir tapi dengan akun/API key sendiri dari rajaongkir.com, kalau Komerce tidak bisa diakses.

---

## 4. **Layanan lain (riset singkat)**

| Provider      | Cek ongkir | Tracking | Catatan                    |
|---------------|------------|----------|----------------------------|
| **BinderByte**| ❌         | ✅ (resi)| Hanya cek resi, bukan tarif|
| **Nusabox**   | ✅         | -        | Perlu cek docs & pricing   |

---

## Saran implementasi (ganti dari RajaOngkir)

1. **Coba dulu RajaOngkir langsung**  
   Daftar di rajaongkir.com, ambil API key **Shipping Cost**, dan uji endpoint (search destination + calculate cost). Kalau format sama dengan yang sekarang, hanya ganti base URL + key.

2. **Kalau tetap gagal: pilih Biteship**  
   - Daftar di Biteship, ambil API key.  
   - Buat module/route baru (mis. `lib/biteship.ts` + `/api/biteship/rates` atau sejenis) yang memetakan:
     - origin/destination (area ID atau kode pos) dari app kamu → format Biteship  
     - response Biteship → format yang dipakai frontend (list kurir + ongkir + etd).  
   - Panggil Biteship dari backend saja (jangan expose API key ke frontend).

3. **Kalau butuh full logistics (order + label + tracking)**  
   Pertimbangkan Shipper; integrasi lebih berat tapi fitur lengkap.

---

## Env / config yang perlu disiapkan

- **RajaOngkir (langsung):** `RAJAONGKIR_API_KEY`, base URL dari docs.  
- **Biteship:** `BITESHIP_API_KEY` (atau nama env yang kamu pilih).  
- **Shipper:** Sesuai yang diberikan Shipper setelah aktivasi.

Semua key dipakai **hanya di server** (env tanpa `NEXT_PUBLIC_`).
