# Video Hub — Rencana Implementasi

## Tujuan
Membangun web app responsif yang memungkinkan pengguna menambahkan dan memilih sampai sembilan identitas melalui login resmi Meta. Ini adalah account switcher berbasis OAuth, bukan sembilan profil Chrome atau tampilan Facebook penuh. Tidak ada VPN, pengambilan video/post, akun demo, maupun penyimpanan password.

## Pendekatan teknis
- Frontend: React + Vite pada repo GitHub `shopppit1-tech/videohub`.
- Hosting: Cloudflare Pages project `videohub`; repository GitHub menjadi source of truth.
- Login: Facebook JavaScript SDK resmi dengan permission minimum `public_profile`; akses meminta login dari Meta.
- Data: daftar slot, user ID app-scoped, token OAuth, waktu kedaluwarsa, dan slot aktif disimpan pada browser perangkat pengguna. Data ini tidak dikirim ke server Video Hub.
- Privasi: tidak meminta atau menyimpan password; tidak memanggil Graph API untuk membaca Page, video, postingan, atau data tambahan. Token OAuth adalah kredensial sensitif lokal dan pengguna dapat menghapusnya dari UI.
- Konfigurasi: `VITE_META_APP_ID` adalah konfigurasi publik yang perlu disediakan melalui Cloudflare Pages build environment. Domain dan redirect/allowed origins harus terdaftar di aplikasi Meta pengguna.
- Batas eksternal: keberhasilan multi-account bergantung pada alur Meta dan sesi Facebook yang sedang ada pada browser. App tidak menjanjikan sembilan sesi browser independen atau akses penuh ke situs Facebook.

## Struktur utama
- `client/src/pages/Home.tsx`: sembilan slot, alur Meta Login, pemilihan, penghapusan, dan informasi batasan.
- `client/src/index.css`: UI mobile-first.
- `vite.config.ts`: build statis Vite.
- `client/public/manus-routes.json`: manifest route.
- GitHub Actions/Cloudflare Pages: build dan deployment dari source repository.

## Design
- Gaya: **calm account switcher** — panel gelap sederhana, fokus pada slot akun dan status koneksi.
- Core principles: setiap slot menunjukkan state nyata; kontrol eksplisit; izin Meta saja; batasan dan penyimpanan token transparan.
- Color philosophy: graphite sebagai latar agar UI tenang; biru terang menandai pilihan/aksi Meta; hijau hanya untuk status terhubung.
- Layout paradigm: header ringkas, pilihan akun aktif, lalu sembilan slot dalam grid 2 kolom di ponsel dan 3 kolom di layar lebar.
- Signature elements: nomor slot kecil, avatar lingkaran, dan indikator akun terpilih.
- Interaction philosophy: pengguna menambahkan satu akun pada satu waktu, memilih akun aktif, dan dapat menghapus token lokal kapan saja.
- Animation: transisi singkat saat hover/focus; tanpa animasi berulang.
- Typography: system sans dengan headline padat dan label metadata ringkas.
- Brand essence: switcher akun Meta yang sederhana dan transparan; terkontrol, jelas, aman.
- Brand voice: “Tambahkan akun melalui login resmi Meta.” dan “Password tidak pernah masuk ke Video Hub.”
- Wordmark & Logo: tulisan Video Hub dengan simbol f sederhana dalam kotak biru.
- Signature brand color: Meta blue `#0866FF`.
