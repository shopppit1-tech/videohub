# TODO — Video Hub

## Dashboard nyata mengikuti mockup
- [ ] Dashboard responsif memakai tema dark navy/electric blue dengan navigasi Beranda, Akun, Video, dan Pengaturan.
- [ ] UI tidak menampilkan akun/video contoh; state awal menunjukkan belum ada koneksi.
- [ ] UI memiliki state loading, error, koneksi berhasil, dan konfigurasi Meta belum tersedia.
- [ ] Batas tampilan maksimal 9 Page dan 9 video tetap diterapkan.

## Login dan koneksi resmi Meta
- [ ] Pengguna yang belum masuk diarahkan ke Manus OAuth aplikasi.
- [ ] Tombol Hubungkan Meta memakai OAuth Authorization Code resmi Meta.
- [ ] `META_APP_ID` dan `META_APP_SECRET` hanya dibaca server-side dari secret environment.
- [ ] OAuth state memakai nonce sekali pakai dan cookie HttpOnly yang aman.
- [ ] Callback menukar code di server, mengambil Page yang diizinkan, dan menyimpan token terenkripsi.
- [ ] Tidak ada password Facebook yang disimpan atau login melalui WebView palsu.

## Data Page dan video nyata
- [ ] Page tersambung disimpan berdasarkan pengguna aplikasi dan dapat diputus.
- [ ] Query daftar Page tidak mengembalikan access token ke browser.
- [ ] Query video meminta data dari Graph API sesuai permission yang tersedia.
- [ ] Video hanya diputar saat pengguna menekan Play; fallback menggunakan permalink resmi bila source tidak dapat diputar.
- [ ] Error permission/rate limit Meta ditampilkan secara terbaca.

## Kualitas dan delivery
- [ ] `public/manus-routes.json` tersedia dan sesuai route.
- [ ] Typecheck bersih.
- [ ] Build produksi berhasil.
- [ ] Preview menjawab `/api/health` dan halaman utama.
- [ ] Proyek siap disimpan ke GitHub setelah integrasi Meta diuji di domain publik.
