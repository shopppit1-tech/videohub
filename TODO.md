# TODO — Video Hub

## Sembilan slot account switcher
- [ ] Tampilkan tepat sembilan slot akun, dengan state kosong/terhubung/kedaluwarsa yang berasal dari data login nyata.
- [ ] Pengguna dapat menambahkan akun melalui dialog login Meta resmi, memilih satu akun aktif, dan menghapus akun dari perangkat.
- [ ] Tampilkan batas sembilan akun dan cegah penambahan slot ke-10.
- [ ] Jangan mengisi slot dengan akun atau status demo.

## Login dan privasi Meta
- [ ] Gunakan Facebook JavaScript SDK resmi dan permission minimum `public_profile`.
- [ ] Tidak meminta atau menyimpan password Facebook.
- [ ] Simpan identitas app-scoped dan token OAuth hanya di storage lokal browser; tidak mengirim token ke server Video Hub.
- [ ] Sediakan tindakan hapus akun tunggal dan hapus semua data/token lokal.
- [ ] Jelaskan bahwa ini account switcher berbasis OAuth, bukan sembilan sesi Chrome atau tampilan penuh Facebook; Meta dapat meminta login/verifikasi ulang.
- [ ] Tidak mengambil Page, video, postingan, atau data Graph tambahan.

## GitHub, Cloudflare, dan konfigurasi
- [ ] Bangun output statis dari repo `shopppit1-tech/videohub`.
- [ ] Set `VITE_META_APP_ID` pada Cloudflare Pages; jika belum ada, UI menyatakan konfigurasi belum tersedia dan tidak berpura-pura login siap.
- [ ] Pastikan allowed domain/origin disiapkan pada Meta Developer App milik pengguna.
- [ ] Deploy ke project Cloudflare Pages `videohub` tanpa menghapus D1 yang ada.

## Kualitas dan delivery
- [ ] `public/manus-routes.json` sesuai route.
- [ ] Typecheck bersih.
- [ ] Build statis berhasil.
- [ ] GitHub berisi perubahan yang dimaksud dan Cloudflare deployment berstatus sukses sebelum URL live dinyatakan selesai.
