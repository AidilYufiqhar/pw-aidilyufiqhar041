(function () {
  'use strict';
  var target = document.getElementById('daftar-pesan');
  if (!target) return;
  var kosong = document.getElementById('pesan-kosong');
  var pesan = [];
  try { pesan = JSON.parse(localStorage.getItem('bf_pesan_kontak') || '[]'); } catch (e) { pesan = []; }
  pesan = pesan.slice().reverse();
  kosong.hidden = pesan.length > 0;
  target.innerHTML = '';
  pesan.forEach(function (item) {
    var kartu = document.createElement('article'); kartu.className = 'pesan-item';
    var meta = document.createElement('div'); meta.className = 'pesan-meta';
    var nama = document.createElement('strong'); nama.textContent = item.nama || 'Pengirim';
    var waktu = document.createElement('time'); var date = new Date(item.dibuat);
    waktu.dateTime = isNaN(date.getTime()) ? '' : date.toISOString();
    waktu.textContent = isNaN(date.getTime()) ? 'Waktu tidak tersedia' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(date);
    var isi = document.createElement('p'); isi.textContent = item.pesan || '';
    meta.append(nama, waktu); kartu.append(meta, isi); target.appendChild(kartu);
  });
})();