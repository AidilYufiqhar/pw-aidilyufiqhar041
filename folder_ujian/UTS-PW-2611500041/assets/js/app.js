/* BF Comunitas – skrip tambahan.
   Fungsinya: menyimpan data ke browser (localStorage), menampilkan daftar member,
   dan menyiapkan data kartu. Struktur halaman (HTML) dan tampilan (CSS) tidak bergantung pada file ini. */
(function () {
  'use strict';

  var KUNCI_MEMBER = 'bf_member';
  var KUNCI_PESAN  = 'bf_pesan_kontak';
  var KUNCI_TERAKHIR = 'bf_member_terakhir';
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  /* ---------- Penyimpanan di browser ---------- */
  function baca(kunci) {
    try { return JSON.parse(localStorage.getItem(kunci) || '[]'); } catch (e) { return []; }
  }
  function tulis(kunci, nilai) {
    try { localStorage.setItem(kunci, JSON.stringify(nilai)); return true; } catch (e) { return false; }
  }
  function semuaMember() { return baca(KUNCI_MEMBER); }
  function cariId(id) {
    var daftar = semuaMember();
    for (var i = 0; i < daftar.length; i++) if (daftar[i].id === id) return daftar[i];
    return null;
  }

  /* ---------- Pembantu ---------- */
  function nomor(id) { return 'BF-' + ('0000' + id).slice(-4); }
  function hariIni() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function tglIndo(s) {
    var p = String(s).split('-');
    if (p.length !== 3) return s;
    return parseInt(p[2], 10) + ' ' + BULAN[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function inisial(nama) {
    return nama.trim().split(/\s+/).slice(0, 2).map(function (k) { return k.charAt(0); }).join('').toUpperCase();
  }
  function setTeks(id, teks) { var el = document.getElementById(id); if (el) el.textContent = teks; }

  /* Dipakai juga oleh kartu.js */
  window.BF = { cariId: cariId, nomor: nomor, tglIndo: tglIndo };

  /* ---------- Menu mobile & validasi (semua halaman) ---------- */
  var toggle = document.getElementById('menu-toggle');
  document.querySelectorAll('.nav a').forEach(function (a) {
    a.addEventListener('click', function () { if (toggle) toggle.checked = false; });
  });

  function pesanError(el) {
    var v = el.validity;
    if (v.valueMissing)    return 'Kolom ini wajib diisi.';
    if (v.typeMismatch && el.type === 'email') return 'Format email belum benar, contoh: nama@email.com';
    if (v.patternMismatch) return 'Kolom ini tidak boleh hanya berisi spasi.';
    if (v.tooShort)        return 'Isi minimal ' + el.minLength + ' karakter.';
    if (v.tooLong)         return 'Maksimal ' + el.maxLength + ' karakter.';
    return '';
  }
  document.querySelectorAll('.form input, .form textarea').forEach(function (el) {
    el.addEventListener('invalid', function () { el.setCustomValidity(''); el.setCustomValidity(pesanError(el)); });
    el.addEventListener('input', function () {
      el.setCustomValidity('');
      if (el.required && el.value.trim() === '') el.setCustomValidity('Kolom ini wajib diisi.');
    });
  });

  document.querySelectorAll('textarea[data-counter]').forEach(function (ta) {
    var target = document.getElementById(ta.getAttribute('data-counter'));
    if (!target) return;
    function hitung() { target.textContent = ta.maxLength - ta.value.length; }
    ta.addEventListener('input', hitung);
    hitung();
  });

  /* ---------- Halaman utama ---------- */
  if (document.getElementById('form-buku-tamu')) {
    var tgl = document.getElementById('tgl_kunjungan041');
    if (tgl && !tgl.value) tgl.value = hariIni();

    var daftar = semuaMember();
    var maks = daftar.reduce(function (m, x) { return Math.max(m, x.id); }, 0);
    document.querySelectorAll('[data-total-member]').forEach(function (el) { el.textContent = daftar.length; });
    document.querySelectorAll('[data-nomor-berikut]').forEach(function (el) { el.textContent = nomor(maks + 1); });

    var q = new URLSearchParams(window.location.search);
    function nilai(k, panjang) { return (q.get(k + '041') || '').trim().slice(0, panjang); }
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (q.has('nm_lengkap041')) {
      /* Form buku tamu dikirim (metode GET) → simpan ke browser */
      var data = {
        nama: nilai('nm_lengkap', 50), email: nilai('email', 60), asal: nilai('asal', 50),
        subjek: nilai('subjek', 60), pesan: nilai('pesan', 300), tgl: nilai('tgl_kunjungan', 10)
      };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tgl)) data.tgl = hariIni();

      if (data.nama && emailOk.test(data.email) && data.pesan) {
        var terbaru = semuaMember();
        data.id = terbaru.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1;
        data.dibuat = new Date().toISOString();
        terbaru.push(data);
        if (tulis(KUNCI_MEMBER, terbaru)) {
          try { sessionStorage.setItem(KUNCI_TERAKHIR, String(data.id)); } catch (e) { /* abaikan */ }
        }
        history.replaceState(null, '', 'index.html#berhasil'); /* hapus data dari URL agar refresh tidak menyimpan dobel */
      } else {
        history.replaceState(null, '', 'index.html#buku-tamu');
      }
    } else if (q.has('nama041')) {
      /* Form kontak dikirim → simpan pesan */
      var pesan = { nama: nilai('nama', 50), email: nilai('email_kontak', 60), pesan: nilai('pesan_kontak', 300), dibuat: new Date().toISOString() };
      if (pesan.nama && emailOk.test(pesan.email) && pesan.pesan) {
        var lama = baca(KUNCI_PESAN); lama.push(pesan); tulis(KUNCI_PESAN, lama);
        history.replaceState(null, '', 'index.html#terkirim');
      } else {
        history.replaceState(null, '', 'index.html#kontak');
      }
    }

    /* Isi notifikasi berhasil dengan data member terakhir */
    var idTerakhir = null;
    try { idTerakhir = parseInt(sessionStorage.getItem(KUNCI_TERAKHIR), 10); } catch (e) { /* abaikan */ }
    var m = idTerakhir ? cariId(idTerakhir) : null;
    if (m) {
      setTeks('nama-berhasil', m.nama);
      setTeks('nomor-berhasil', nomor(m.id));
      var u = document.getElementById('btn-unduh-kartu'), l = document.getElementById('btn-lihat-kartu');
      if (u) u.href = 'kartu.html?id=' + m.id + '&unduh=1';
      if (l) l.href = 'kartu.html?id=' + m.id;
    }
  }

  /* ---------- Pencarian (halaman member & kartu) ---------- */
  function saring(daftar, kata) {
    kata = kata.trim().toLowerCase();
    if (!kata) return daftar;
    var mNomor = kata.match(/^bf-?0*(\d+)$/);
    return daftar.filter(function (m) {
      if (mNomor) return m.id === parseInt(mNomor[1], 10);
      return [m.nama, m.email, m.asal, m.subjek].join(' ').toLowerCase().indexOf(kata) !== -1;
    });
  }
  function tampilKosong(ada, adaPencarian) {
    var k = document.getElementById('kosong');
    if (!k) return;
    k.hidden = ada;
    setTeks('kosong-judul', adaPencarian ? 'Tidak ada hasil' : 'Belum ada member');
    setTeks('kosong-teks', adaPencarian ? 'Coba kata kunci lain.' : 'Jadilah yang pertama bergabung lewat buku tamu.');
  }

  /* Halaman Daftar Member */
  var isiTabel = document.getElementById('isi-tabel');
  if (isiTabel) {
    var kolomCari = document.getElementById('q');
    var gambarTabel = function () {
      var semua = semuaMember().slice().reverse();
      var kata = kolomCari.value;
      var hasil = saring(semua, kata);
      setTeks('jumlah-member', hasil.length + ' orang ' + (kata.trim() ? 'cocok dengan pencarianmu.' : 'sudah bergabung.'));
      document.getElementById('tabel-bungkus').hidden = hasil.length === 0;
      tampilKosong(hasil.length > 0, kata.trim() !== '');
      isiTabel.innerHTML = hasil.map(function (m, i) {
        return '<tr>' +
          '<td data-label="No">' + (i + 1) + '</td>' +
          '<td data-label="Member"><div class="orang"><span class="avatar">' + esc(inisial(m.nama)) + '</span><div><strong>' + esc(m.nama) + '</strong><small>' + nomor(m.id) + ' &middot; ' + esc(m.email) + '</small></div></div></td>' +
          '<td data-label="Asal">' + (m.asal ? esc(m.asal) : '<span class="redup">-</span>') + '</td>' +
          '<td data-label="Pesan">' + (m.subjek ? '<strong class="subjek">' + esc(m.subjek) + '</strong>' : '') + '<span class="pesan-ringkas">' + esc(m.pesan) + '</span></td>' +
          '<td data-label="Kunjungan">' + esc(tglIndo(m.tgl)) + '</td>' +
          '<td class="aksi"><a class="btn btn-kecil" href="kartu.html?id=' + m.id + '">Lihat kartu</a></td>' +
          '</tr>';
      }).join('');
    };
    kolomCari.addEventListener('input', gambarTabel);
    gambarTabel();
  }

  /* Halaman Kartu Member */
  var detail = document.getElementById('kartu-detail');
  if (detail) {
    var param = new URLSearchParams(window.location.search);
    var idParam = parseInt(param.get('id'), 10);
    var anggota = idParam ? cariId(idParam) : null;

    if (anggota) {
      document.getElementById('kartu-cari').hidden = true;
      detail.hidden = false;
      setTeks('kartu-sub', 'Kartu ini dibuat dari data yang kamu isi di buku tamu.');
      setTeks('info-nama', anggota.nama);
      setTeks('info-nomor', nomor(anggota.id));
      setTeks('info-email', anggota.email);
      setTeks('info-asal', anggota.asal || '-');
      setTeks('info-tanggal', tglIndo(anggota.tgl));
      var c = document.getElementById('kartu');
      c.dataset.nama = anggota.nama;
      c.dataset.nomor = nomor(anggota.id);
      c.dataset.asal = anggota.asal || '';
      c.dataset.email = anggota.email;
      c.dataset.tanggal = tglIndo(anggota.tgl);
      c.dataset.namaKomunitas = 'BF Comunitas';
      c.dataset.logo = 'img/logo/logo.png';
      c.dataset.unduh = param.get('unduh') === '1' ? '1' : '0';
    } else {
      if (idParam) document.getElementById('kartu-tidak-ada').hidden = false;
      var kolom = document.getElementById('q');
      var daftarHasil = document.getElementById('hasil');
      var gambarHasil = function () {
        var kata = kolom.value.trim();
        var semua = semuaMember().slice().reverse();
        var hasil = kata ? saring(semua, kata).slice(0, 12) : semua.slice(0, 6);
        setTeks('judul-hasil', kata ? 'Hasil pencarian' : 'Member terbaru');
        document.getElementById('judul-hasil').hidden = hasil.length === 0;
        tampilKosong(hasil.length > 0, kata !== '');
        daftarHasil.innerHTML = hasil.map(function (m) {
          return '<li><a href="kartu.html?id=' + m.id + '"><span class="avatar">' + esc(inisial(m.nama)) + '</span>' +
            '<span class="hasil-teks"><strong>' + esc(m.nama) + '</strong><small>' + nomor(m.id) + (m.asal ? ' &middot; ' + esc(m.asal) : '') + '</small></span>' +
            '<span class="hasil-aksi">Lihat kartu</span></a></li>';
        }).join('');
      };
      kolom.addEventListener('input', gambarHasil);
      gambarHasil();
    }
  }
})();
