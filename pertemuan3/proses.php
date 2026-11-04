<?php
// Hanya terima data dari form (method post)
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: index.html");
    exit;
}

// Ambil data dari form
$nama  = trim($_POST["nama"] ?? "");
$email = trim($_POST["email"] ?? "");
$prodi = $_POST["prodi"] ?? "";
$pesan = trim($_POST["pesan"] ?? "");

// Validasi sederhana di sisi server
if (strlen($nama) < 3 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Data tidak valid. <a href='index.html'>Kembali</a>");
}

// Ubah kode prodi menjadi nama lengkap
$daftarProdi = [
    "si" => "Sistem Informasi",
    "ti" => "Teknik Informatika",
    "bd" => "Bisnis Digital"
];
$namaProdi = $daftarProdi[$prodi] ?? "-";

// Data kartu
$idKartu = date("Ymd_His") . "_" . bin2hex(random_bytes(3));
$tanggal = date("d-m-Y H:i:s");

$data = [
    "id"      => $idKartu,
    "nama"    => $nama,
    "email"   => $email,
    "prodi"   => $namaProdi,
    "pesan"   => $pesan,
    "tanggal" => $tanggal
];

// Simpan ke folder database
$folder = __DIR__ . "/database";
if (!is_dir($folder)) {
    mkdir($folder, 0777, true);
}
file_put_contents(
    $folder . "/kartu_" . $idKartu . ".json",
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

// Amankan teks sebelum ditampilkan
$e = fn($teks) => htmlspecialchars($teks, ENT_QUOTES, "UTF-8");
$inisial = strtoupper(mb_substr($nama, 0, 1));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>Kartu Digital</title>
</head>
<body>
    <div class="kartu-digital">
        <div class="kartu-header">
            <span>KARTU DIGITAL</span>
            <small>ID: <?= $e($idKartu) ?></small>
        </div>

        <div class="kartu-isi">
            <div class="avatar"><?= $e($inisial) ?></div>
            <div class="kartu-data">
                <h2><?= $e($nama) ?></h2>
                <p><b>Email</b><br><?= $e($email) ?></p>
                <p><b>Program Studi</b><br><?= $e($namaProdi) ?></p>
                <p><b>Pesan</b><br><?= $pesan !== "" ? nl2br($e($pesan)) : "-" ?></p>
            </div>
        </div>

        <div class="kartu-footer">Dibuat pada <?= $e($tanggal) ?></div>
    </div>

    <p class="kembali"><a href="index.html">&larr; Isi formulir lagi</a></p>
</body>
</html>