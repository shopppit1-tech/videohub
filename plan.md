# Video Hub — Rencana Implementasi

## Tujuan
Membangun web app responsif yang mengikuti mockup dark navy/electric blue untuk menghubungkan akun/Page melalui OAuth resmi Meta, menampilkan maksimal 9 Page dan video nyata, serta menyediakan pemutaran atau pembukaan video secara manual. Tidak ada data demo, password Facebook, autoplay massal, loop tersembunyi, atau manipulasi tayangan.

## Pendekatan teknis
- Frontend: React + Vite + Tailwind pada starter web-db-user.
- Backend: Express + tRPC.
- Identitas aplikasi: Google OAuth untuk sesi pengguna aplikasi; koneksi Meta tetap terpisah melalui Meta OAuth.
- Integrasi Meta: server-side OAuth Authorization Code flow; App ID dan App Secret hanya dari environment secret.
- Data: MySQL/Drizzle untuk koneksi Meta yang terenkripsi, Page yang diizinkan, dan metadata video yang diperlukan.
- Keamanan: state OAuth sekali pakai, cookie HttpOnly/SameSite=None/Secure, token Meta tidak pernah dikirim ke browser, dan batas maksimal 9 Page/9 video di UI.
- Media: bila Meta memberikan URL sumber yang dapat diputar dengan izin yang sesuai, gunakan pemutar HTML5; jika tidak, gunakan tautan resmi `permalink_url` ke Meta. Tidak memalsukan thumbnail atau URL.

## Ruang lingkup tahap ini
1. Dashboard nyata dengan state kosong, loading, error, terhubung, dan belum terkonfigurasi.
2. Tombol Masuk dengan Google jika pengguna belum masuk.
3. Tombol Hubungkan Meta yang mengarahkan ke OAuth resmi.
4. Callback OAuth server-side dan pertukaran code.
5. Pengambilan Page yang tersedia melalui `/me/accounts` dan penyimpanan token Page terenkripsi.
6. Endpoint tRPC untuk membaca Page dan video nyata.
7. Pemutaran manual per kartu video atau pembukaan permalink resmi.
8. Pengaturan untuk memutus koneksi Meta.
9. Route manifest, diagnostics, preview, typecheck, dan build.

## Batasan eksternal
- Meta App ID, App Secret, valid OAuth redirect URI, permissions, dan App Review berada di akun Meta pengguna.
- Akses video/Reels bergantung pada permission dan jenis asset yang diberikan Meta. Aplikasi tidak mengotomatisasi banyak login pribadi.
- Deployment/public domain diperlukan agar redirect URI Meta dapat didaftarkan.

## Struktur utama
- `client/src/pages/Home.tsx`: dashboard dan interaksi UI.
- `client/src/index.css`: tema dan layout responsif.
- `server/metaOAuth.ts`: login/callback Meta dan sinkronisasi Page.
- `server/metaApi.ts`: panggilan Graph API terautentikasi.
- `server/db.ts`: query koneksi/Page/video.
- `drizzle/schema.ts`: tabel koneksi dan Page.
- `server/routers.ts`: query/mutation tRPC yang terlindungi.
- `public/manus-routes.json`: deklarasi route halaman.

## Design
- **Gaya yang dipilih: Control-room mobile** — dashboard gelap yang ringkas dengan fokus pada status koneksi dan kartu media.
- **Core principles:** status selalu terlihat; aksi manual jelas; konten nyata tidak digantikan placeholder; kontras tinggi dan touch target besar.
- **Color philosophy:** navy pekat memberi latar tenang, electric blue menandai aksi utama, amber dipakai hanya untuk peringatan konfigurasi.
- **Layout paradigm:** header berstatus, strip metrik ringkas, lalu dua area konten yang dapat discroll; desktop memakai grid yang melebar, mobile memakai satu kolom.
- **Signature elements:** glow biru tipis, kartu dengan status dot, dan tombol play berbentuk lingkaran.
- **Interaction philosophy:** setiap aksi eksplisit dan dapat dibatalkan; tidak ada aksi yang berjalan otomatis saat halaman dibuka.
- **Animation:** transisi 150–200ms untuk hover/focus; skeleton saat memuat; tidak ada animasi autoplay media.
- **Typography:** Inter/system sans, hierarki tebal untuk angka dan label ringkas untuk metadata.
- **Brand essence:** panel kontrol aman untuk mengelola media Meta milik pengguna; jelas, terkendali, dan tidak manipulatif.
- **Brand voice:** “Hubungkan sumber resmi Anda.” dan “Pilih video lalu putar secara manual.”
