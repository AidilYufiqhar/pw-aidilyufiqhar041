BF COMUNITAS - UTS Pemrograman Web (HTML dan CSS)
=================================================

CARA BUKA
  Klik dua kali index.html (atau pakai Live Server di VS Code).
  Tidak butuh PHP, XAMPP, atau internet (internet hanya untuk font Google).

FILE UTAMA
  index.html   beranda, tentang kami, layanan, galeri, kontak, buku tamu, footer
  member.html  daftar member
  kartu.html   kartu member (unduh PNG)
  assets/css/style.css   seluruh tampilan
  img/logo/logo.png      logo -> timpa dengan logo kamu (nama file sama)
  img/img_informasi/     tentang, layanan1-3, galeri1-4 (.svg) -> ganti fotomu;
                         kalau pakai .jpg/.png, ubah nama file di index.html

CATATAN DATA
  HTML dan CSS tidak bisa membuat database. Data buku tamu disimpan di browser
  (localStorage) lewat assets/js/app.js. Artinya data ada di browser dan komputer
  yang sama, dan hilang kalau data browser dihapus.
  Kalau dosen hanya menilai HTML dan CSS, hapus baris <script> di bagian bawah
  tiap file .html: halaman tetap utuh, hanya fitur simpan/daftar/kartu yang mati.

FORM (metode GET, name berakhiran 041)
  Buku tamu: nm_lengkap041, email041, asal041, subjek041, pesan041, tgl_kunjungan041
  Kontak   : nama041, email_kontak041, pesan_kontak041
  Ganti 041 dengan 3 digit terakhir NIM kalau berbeda.

Jangan lupa ganti nama folder menjadi UTS-PW-<NIM lengkap>.
