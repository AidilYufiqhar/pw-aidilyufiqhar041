/* BF Comunitas – menggambar kartu member ke canvas dan mengunduhnya sebagai PNG */
(function () {
  'use strict';

  var canvas = document.getElementById('kartu');
  if (!canvas) return;

  var d   = canvas.dataset;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;

  var BIRU = '#1747c9', BIRU_TUA = '#0a2468', BIRU_LANGIT = '#eaf1ff';
  var CYAN = '#12bfd6', CYAN_MUDA = '#dcf7fb', ABU = '#4b5b7a', GARIS = '#d9e3f5';
  var F_JUDUL = '"Bricolage Grotesque", "Trebuchet MS", "Segoe UI", sans-serif';
  var F_ISI   = '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';

  function kotak(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function potong(teks, lebarMaks) {
    if (ctx.measureText(teks).width <= lebarMaks) return teks;
    while (teks.length > 1 && ctx.measureText(teks + '…').width > lebarMaks) teks = teks.slice(0, -1);
    return teks + '…';
  }

  function inisial(nama) {
    return nama.trim().split(/\s+/).slice(0, 2).map(function (k) { return k.charAt(0); }).join('').toUpperCase();
  }

  function muatLogo() {
    return new Promise(function (selesai) {
      var img = new Image();
      img.onload  = function () { selesai(img); };
      img.onerror = function () { selesai(null); };
      img.src = d.logo;
    });
  }

  function gambar(logo) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    kotak(0, 0, W, H, 40);
    ctx.clip();

    /* latar putih */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    /* pita biru di atas + lingkaran cyan */
    ctx.fillStyle = BIRU;
    ctx.fillRect(0, 0, W, 190);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, 190); ctx.clip();
    ctx.fillStyle = CYAN;
    ctx.beginPath(); ctx.arc(W - 70, 10, 150, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = BIRU_TUA;
    ctx.beginPath(); ctx.arc(W - 20, 190, 90, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = CYAN;
    ctx.fillRect(0, 190, W, 12);

    /* logo */
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(112, 96, 60, 0, Math.PI * 2); ctx.fill();
    if (logo) {
      var s = 92, rasio = Math.min(s / logo.width, s / logo.height);
      var lw = logo.width * rasio, lh = logo.height * rasio;
      ctx.drawImage(logo, 112 - lw / 2, 96 - lh / 2, lw, lh);
    } else {
      ctx.fillStyle = BIRU; ctx.font = '800 44px ' + F_JUDUL;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('BF', 112, 98);
    }

    /* judul pita */
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 50px ' + F_JUDUL;
    ctx.fillText(d.namaKomunitas || 'BF Comunitas', 196, 96);
    ctx.fillStyle = '#cfe0ff';
    ctx.font = '600 26px ' + F_ISI;
    ctx.fillText('Kartu Anggota', 198, 136);

    /* avatar inisial */
    var ax = W - 170, ay = 340;
    ctx.fillStyle = BIRU_LANGIT;
    ctx.beginPath(); ctx.arc(ax, ay, 96, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = CYAN; ctx.stroke();
    ctx.fillStyle = BIRU; ctx.font = '800 84px ' + F_JUDUL;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(inisial(d.nama), ax, ay + 4);

    /* nama */
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    var lebarNama = W - 60 - 320;
    var ukuran = 64;
    ctx.fillStyle = BIRU_TUA;
    do { ctx.font = '800 ' + ukuran + 'px ' + F_JUDUL; ukuran -= 2; }
    while (ctx.measureText(d.nama).width > lebarNama && ukuran > 30);
    ctx.fillText(potong(d.nama, lebarNama), 60, 318);

    /* asal */
    ctx.fillStyle = ABU; ctx.font = '600 28px ' + F_ISI;
    ctx.fillText(potong(d.asal || 'Anggota komunitas', lebarNama), 60, 366);

    /* nomor member */
    kotak(60, 410, 270, 68, 34);
    ctx.fillStyle = CYAN_MUDA; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = CYAN; ctx.stroke();
    ctx.fillStyle = BIRU_TUA; ctx.font = '700 36px ' + F_ISI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.nomor, 60 + 135, 445);

    /* garis dan keterangan bawah */
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = GARIS; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(60, 528); ctx.lineTo(W - 60, 528); ctx.stroke();
    ctx.fillStyle = ABU; ctx.font = '500 24px ' + F_ISI;
    ctx.fillText(potong(d.email, 480), 60, 582);
    ctx.textAlign = 'right';
    ctx.fillText('Kunjungan: ' + d.tanggal, W - 60, 582);

    ctx.restore();
  }

  var logoAsli = null;

  function bisaDiekspor() {
    try { canvas.toDataURL(); return true; } catch (err) { return false; }
  }

  function muatCadangan() {
    return new Promise(function (selesai) {
      if (!window.BF_LOGO) { selesai(null); return; }
      var img = new Image();
      img.onload  = function () { selesai(img); };
      img.onerror = function () { selesai(null); };
      img.src = window.BF_LOGO;
    });
  }

  function simpanBlob() {
    var status = document.getElementById('status-unduh');
    canvas.toBlob(function (blob) {
      var slug = d.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member';
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Kartu-' + d.nomor + '-' + slug + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
      if (status) status.textContent = 'Kartu berhasil diunduh.';
      if (!bisaDiekspor()) gambar(logoAsli);
    }, 'image/png');
  }

  function unduh() {
    var status = document.getElementById('status-unduh');
    if (bisaDiekspor()) { simpanBlob(); return; }
    /* Halaman dibuka lewat file:// → browser memblokir ekspor gambar dari file lokal.
       Pakai logo cadangan (tertanam) khusus untuk file unduhan. */
    muatCadangan().then(function (cadangan) {
      gambar(cadangan);
      if (bisaDiekspor()) simpanBlob();
      else if (status) status.textContent = 'Kartu belum bisa diunduh dari file lokal. Buka lewat server lokal (misalnya Live Server).';
    });
  }

  var tunggu = [];
  if (document.fonts && document.fonts.load) {
    tunggu.push(document.fonts.load('800 50px "Bricolage Grotesque"'));
    tunggu.push(document.fonts.load('600 26px "Plus Jakarta Sans"'));
  }

  Promise.all([muatLogo(), Promise.all(tunggu).catch(function () {})]).then(function (hasil) {
    logoAsli = hasil[0];
    gambar(hasil[0]);
    var tombol = document.getElementById('btn-unduh');
    if (tombol) tombol.addEventListener('click', unduh);
    if (d.unduh === '1') unduh();
  });
})();
