# OWNER_Review.md — Tinjauan Aplikasi dari Sudut Pandang Owner Bisnis

Dokumen ini ditulis dengan **kacamata owner studio (HOM Clinical Pilates)** — bukan
developer. Fokusnya: "Saat saya buka halaman ini, keputusan bisnis apa yang ingin saya
ambil? Apakah halaman ini membantu saya, atau malah membingungkan?" Tiap halaman dibuka
dan diaudit, lalu diberi rekomendasi: **pertahankan / hapus / tata ulang / tambah**.

- Lingkungan ditinjau: `https://hom-gamma.vercel.app` (data DEMO) + kode sumber.
- Tanggal tinjauan: konteks Juni 2026.
- Catatan: beberapa perubahan terbaru (logo sidebar, tombol minimize) masih lokal dan
  belum tampil di lingkungan deployed; tinjauan konten halaman tidak terpengaruh.

---

## 1. Ringkasan Eksekutif (untuk Owner)

**Kondisi besar:** aplikasi sekarang terbagi dua dunia yang belum menyatu:

1. **Halaman operasional NYATA** (data Supabase, bisa aksi): `Appointments`, `Clients`,
   `Practitioners`, `Services`, `Packages`, `Client Packages`, `Payments`. Ini solid,
   read-only + aksi terkontrol (buat/cancel/complete/bayar), dan aman.
2. **Halaman MOCK / placeholder** (data palsu, tidak berfungsi): `Overview/Strategic
   Overview`, `Financials`, `Live Chat`, `Knowledge Studio`, `Behavior Intelligence`,
   `AI Business Agent`, `Approvals`, `Settings`, `Chronic Case Registry`,
   `Team Attendance`.

**Tiga masalah yang paling mengganggu mata owner:**

- **"Mock load failure" muncul permanen** di bawah hampir setiap halaman placeholder
  (kartu merah dengan tombol Retry + kartu kosong + "Permission required"). Ini artefak
  uji-layout developer. Bagi owner, ini **terlihat seperti aplikasi rusak/error**.
- **Label "Mock" terpampang di mana-mana** ("Mock May 2026 period", "Mock client
  registry", "Mock ledger", "Mock utilization table"). Untuk demo ke investor/staff ini
  menurunkan kepercayaan.
- **Halaman Overview (yang pertama dilihat owner) 100% data palsu** dan tidak menyorot
  hal yang paling penting bagi owner: **tren pendapatan vs klien baru per bulan**.

**Arahan utama:** Overview harus jadi *cockpit owner* yang menjawab "bisnis saya sehat
atau tidak?" dalam 5 detik — diawali grafik **Revenue vs Klien Baru per bulan** di
paling atas. Halaman mock yang fiturnya belum dibangun sebaiknya **disembunyikan dari
menu** atau ditandai jelas "Coming soon", bukan dibiarkan tampak seperti fitur jadi.

---

## 2. Audit Per-Halaman

### 2.1 Overview / Strategic Overview (`/` dan `/dashboard/executive-command`) — PRIORITAS TERTINGGI

**Yang owner pedulikan di sini:** Apakah pendapatan naik? Berapa klien baru bulan ini
vs bulan lalu? Apakah jadwal padat? Berapa uang yang belum tertagih (pending payment)?
Apakah ada paket klien yang hampir habis (peluang jualan ulang)?

**Kondisi sekarang (semua MOCK):**
- 4 kartu "attention": *WhatsApp blast approvals, Reminder delivery, Finance
  reconciliation, Reschedule confirmations* — **3 dari 4 menyangkut fitur yang belum
  dibangun** (WhatsApp, reminder). Tidak relevan untuk owner hari ini.
- 4 metric: *Monthly Revenue Rp 184.2M (+12.4%), Active Clients 486 (+28), Pending
  Approvals 9, Open Chat Interventions 14* — semua angka palsu, label "Mock …".
- Kartu *Revenue growth* = grafik batang statis 6 bulan (M1–M6) **tanpa angka, tanpa
  overlay klien baru** — hanya hiasan.
- Kartu *AI intelligence* = dua kotak teks "deferred" (placeholder).
- Tabel *Practitioner metrics* (Firly/Maya/Raka) — "Mock utilization table for layout
  validation only".

**Masalah dari kacamata owner:**
- Halaman pertama justru paling tidak berguna: tak ada satu pun angka nyata.
- Hal terpenting (tren revenue vs klien baru) hanya jadi grafik hiasan di tengah.
- Banyak kartu menyorot fitur yang belum ada (WhatsApp, AI handoff).

**Rekomendasi:**
- **TAMBAH & PINDAH KE ATAS:** grafik **"Pendapatan vs Klien Baru per Bulan"** (dual-axis:
  bar = revenue/bulan, garis = jumlah klien baru/bulan, 6–12 bulan). Inilah pertanyaan
  bisnis nomor satu owner. Letakkan sebagai elemen pertama setelah judul.
- **GANTI 4 metric mock** dengan **KPI nyata dari data operasional** yang sudah ada:
  - *Pendapatan bulan ini* (jumlah `payments` status `paid` bulan berjalan).
  - *Klien baru bulan ini* (count `clients` dibuat bulan berjalan).
  - *Pembayaran tertunda* (jumlah & nilai `payments` status `pending`) — uang yang
    belum masuk.
  - *Janji temu mendatang* (count `appointments` `scheduled` ke depan).
- **HAPUS / SEMBUNYIKAN** kartu attention yang menyangkut fitur belum-ada (WhatsApp
  blast, Reminder delivery, Open Chat Interventions). Ganti dengan **"Aksi perlu
  perhatian" nyata**: paket klien hampir habis (sisa sesi ≤ 2), pembayaran pending > X
  hari, appointment no-show terbaru.
- **HAPUS** kartu *AI intelligence* placeholder di Overview — fungsinya tumpang tindih
  dengan **AI Demo Summary** nyata yang sudah ada di halaman Appointments. Cukup satu
  ringkasan AI nyata; jangan dua-duanya (satu palsu satu asli) di app yang sama.
- **RE-LAYOUT** tabel *Practitioner metrics*: pertahankan konsep (utilisasi
  praktisi penting bagi owner), tapi isi dengan data nyata dari `appointments` per
  praktisi, atau tandai jelas "contoh" bila belum ada perhitungan.
- Hapus tombol "Mock period: May 2026" → ganti pemilih periode nyata (bulan ini /
  bulan lalu / kuartal).

**Usulan tata letak Overview baru (atas → bawah):**
1. Baris KPI nyata (4 kartu): Pendapatan bln ini · Klien baru bln ini · Pending payment
   (nilai) · Appointment mendatang.
2. **Grafik besar "Pendapatan vs Klien Baru per Bulan"** (lebar penuh) — *paling
   menonjol*.
3. Dua kolom: "Perlu perhatian" (paket hampir habis, pending payment lama, no-show) +
   "Aktivitas terbaru" (appointment/payment terakhir).
4. (Opsional) Utilisasi praktisi nyata.

### 2.2 Appointments (`/appointments`) — NYATA ✅

**Owner peduli:** jadwal padat/tidak, no-show, slot bentrok, sesi selesai (untuk
potong paket).

**Kondisi:** tabel jadwal nyata + aksi (Reschedule/Cancel/Complete/Mark No-show/Deduct
Session) + proteksi bentrok. Ada kartu **AI Demo Summary** (read-only, aman) di bawah.

**Rekomendasi:**
- Pertahankan. Ini halaman terkuat.
- **Re-layout kecil:** kartu *AI Demo Summary* sebaiknya **dipindah ke Overview**
  (tempat owner, bukan di tengah halaman operasional front-desk). Di Appointments, fokus
  staff adalah jadwal.
- Tambah filter cepat (Hari ini / Minggu ini / status) — owner & front-desk sering
  butuh "apa agenda hari ini".
- Metric atas ("Loaded appointments / Visible rows / Schedule source") terlalu teknis
  ("repository result", "supabase", "local workspace") → ganti bahasa bisnis: "Janji
  hari ini", "Akan datang", "Selesai".

### 2.3 Clients (`/clients`) — NYATA ✅

**Owner peduli:** berapa klien aktif, siapa berisiko hilang (retensi), siapa klien
bernilai tinggi (LTV).

**Kondisi:** katalog klien read-only (data Supabase).

**Rekomendasi:**
- Pertahankan.
- Tambah indikator bisnis: status lifecycle, sisa paket, kunjungan terakhir (untuk
  retensi). Menu mengarahkan ke "Client LTV & Milestones" — wujudkan minimal LTV
  sederhana (total pembayaran per klien).
- Hilangkan istilah teknis pada kartu metric (samakan dengan poin 2.2).

### 2.4 Practitioners (`/practitioners`) — NYATA ✅

**Owner peduli:** beban kerja & utilisasi tiap praktisi, siapa over/under-utilized.

**Kondisi:** katalog praktisi read-only.

**Rekomendasi:** pertahankan. Hubungkan ke utilisasi nyata (jumlah sesi/jam per
praktisi per minggu) — ini yang owner pakai untuk keputusan jadwal & komisi.

### 2.5 Services (`/services`) — NYATA ✅

**Owner peduli:** layanan mana paling laku & paling menguntungkan, harga.

**Kondisi:** katalog layanan read-only (nama, kategori, durasi, harga IDR).

**Rekomendasi:** pertahankan. Tambah (nanti) "jumlah booking per layanan" agar owner
tahu produk unggulan.

### 2.6 Packages (`/packages`) & 2.7 Client Packages (`/client-packages`) — NYATA ✅

**Owner peduli:** paket mana laku, berapa sisa sesi pelanggan (peluang jual ulang),
paket yang akan kedaluwarsa.

**Kondisi:** katalog paket + kepemilikan paket klien (sisa sesi, status) read-only +
aksi assign/deduct nyata.

**Rekomendasi:**
- Pertahankan — ini sumber pendapatan berulang.
- Tambah penyorot "sisa sesi rendah" & "akan kedaluwarsa" → feed ke "Perlu perhatian"
  di Overview.

### 2.8 Payments (`/payments`) — NYATA ✅

**Owner peduli:** uang masuk, yang masih tertunda (belum tertagih), yang batal.

**Kondisi:** catatan pembayaran read-only + aksi (buat/mark paid/cancel).

**Rekomendasi:**
- Pertahankan — krusial untuk arus kas.
- Tambah ringkasan atas: total paid bulan ini, total pending (nilai), total cancelled.
  Saat ini metric atas masih bahasa teknis.

### 2.9 Financials (`/financials`) — MOCK ❌

**Owner peduli:** laba/rugi, pendapatan vs biaya, ekspor untuk akuntan.

**Kondisi:** tabel "Mock ledger" (Private sessions/Group classes/COGS placeholder) +
**kartu merah "Mock load failure"** di bawah. Tidak ada angka nyata.

**Rekomendasi:**
- **Hapus artefak "Mock load failure / Permission required / skeleton kosong"** (lihat
  Bagian 3).
- Sementara fitur finance belum dibangun: **tandai jelas "Coming soon"** atau gantikan
  isinya dengan ringkasan pembayaran nyata (dari `payments`) supaya tidak terlihat
  palsu. Jangan tampilkan "Mock ledger" ke owner.

### 2.10 Live Chat, 2.11 Knowledge Studio, 2.12 Behavior Intelligence, 2.13 AI Business Agent — MOCK ❌

Semua memakai template mock yang sama (metric palsu + worklist palsu + baris
Loading/Error/Permission). Fiturnya (WhatsApp inbox, AI knowledge, analitik perilaku,
agen AI) **belum dibangun**.

**Rekomendasi:**
- **Sembunyikan dari menu utama** sampai dibangun, atau pindahkan ke grup menu "Segera
  hadir" yang jelas. Membiarkannya tampak seperti fitur jadi berisiko: staff mengira
  bisa dipakai, owner salah menilai kapabilitas produk.
- Hapus artefak error mock (Bagian 3).
- `AI Business Agent` & `Knowledge Studio` & `Behavior Intelligence` & `Live Chat`
  adalah **roadmap masa depan**, bukan fitur sekarang — komunikasikan demikian.

### 2.14 Approvals (`/approvals`) — MOCK ❌

**Owner peduli:** persetujuan tindakan sensitif (refund, blast, unlock catatan).

**Kondisi:** worklist mock + artefak error. Fitur belum nyata.

**Rekomendasi:** sama — sembunyikan/tandai "Coming soon", hapus artefak. Approvals akan
penting saat finance/WhatsApp/AI dibangun, tapi belum sekarang.

### 2.15 Settings (`/settings`) — MOCK ❌ (padahal auth NYATA sudah ada)

**Owner peduli:** kelola user & peran staff (siapa boleh apa), ganti password.

**Kondisi:** halaman mock (Supabase Auth "Deferred", "placeholder") — **padahal di
balik layar auth Supabase + RBAC sudah berfungsi nyata** (super_admin login, peran,
permission). Jadi halaman Settings *under-selling* kemampuan yang sudah ada.

**Rekomendasi (prioritas menengah-tinggi):**
- Wujudkan Settings minimal nyata: daftar user + peran (read-only dari `app_users` /
  `user_roles`), dan jalur undang/kelola user (sesuai rencana Phase 7 auth). Ini yang
  owner butuhkan untuk onboarding staff hari pertama.
- Hapus tabel mock "Supabase Auth Deferred".

### 2.16 Chronic Case Registry (`/clinical-cases`) & 2.17 Team Attendance (`/team-attendance`) — MOCK ❌ + DATA SALAH

**Masalah khusus:** keduanya **meminjam data mock halaman lain** — `clinical-cases`
memakai data **Approvals** (kolom Request/Requester/Risk), `team-attendance` memakai
data **Appointments**. Jadi judul dan isi **tidak nyambung** (mis. "Chronic Case
Registry" menampilkan "WhatsApp blast clearance"). Sangat membingungkan.

**Rekomendasi:** sembunyikan dari menu sampai dibangun, atau minimal perbaiki agar
isi sesuai judul. Saat ini **wajib disembunyikan** dari demo owner.

---

## 3. Temuan Lintas-Halaman (berlaku untuk banyak halaman)

1. **Artefak "Mock load failure" wajib dihapus.** Komponen `ModuleMockPage` selalu
   merender di bagian bawah: kartu kosong (skeleton), kartu merah **"Mock load failure —
   Real retries will be wired after APIs exist. [Retry]"**, dan **"Permission
   required"**. Ini alat uji-layout developer yang **tidak boleh terlihat owner/klien**.
   Muncul di: Financials, Live Chat, Knowledge Studio, Behavior Intelligence, AI
   Business Agent, Approvals, Settings, Chronic Case Registry, Team Attendance.
2. **Hilangkan kata "Mock" dari UI** ("Mock May 2026 period", "Mock client registry",
   "Mock ledger", "Mock utilization", "Export mock", "Create draft"). Untuk presentasi,
   ganti dengan label netral atau data nyata.
3. **Bahasa teknis di kartu metric halaman nyata** ("repository result", "supabase",
   "local workspace", "read-only", "page 1") → ganti ke bahasa bisnis. Owner tidak peduli
   "repository"; ia peduli "Janji hari ini: 5".
4. **Dua ringkasan AI yang membingungkan:** ada *AI intelligence* (placeholder) di
   Overview dan *AI Demo Summary* (nyata) di Appointments. Satukan: pakai yang nyata,
   taruh di Overview, hapus placeholder.
5. **Menu mencampur fitur jadi & belum-jadi tanpa pembeda.** Sidebar menampilkan 15 menu
   setara, padahal 7 nyata dan 8+ mock. Owner/staff tak bisa membedakan. Rekomendasi:
   kelompokkan ("Operasional" vs "Segera hadir") atau sembunyikan yang mock.
6. **Tab "Executive Command" di topbar** (Strategic Overview, Chronic Case Registry,
   Team Attendance, Financial Strategy, Client LTV, User Management, Approvals & Payroll)
   sebagian mengarah ke halaman mock/duplikat. Rapikan agar hanya mengarah ke halaman
   yang berguna.

---

## 4. Rekomendasi Prioritas

**P0 — Wajib sebelum dilihat owner/investor/staff (cepat, dampak besar):**
- Hapus artefak "Mock load failure / skeleton / Permission required" dari semua halaman.
- Sembunyikan dari menu halaman yang murni mock & fiturnya belum ada (Live Chat,
  Knowledge Studio, Behavior Intelligence, AI Business Agent, Chronic Case Registry,
  Team Attendance), atau beri grup "Segera hadir".
- Hilangkan kata "Mock" dari teks yang tampil.
- Perbaiki Chronic Case Registry & Team Attendance yang isinya nyasar (atau sembunyikan).

**P1 — Menjadikan Overview berguna bagi owner:**
- Bangun **grafik "Pendapatan vs Klien Baru per Bulan"** di paling atas Overview.
- Ganti 4 metric mock dengan **KPI nyata** (revenue bln ini, klien baru, pending
  payment, appointment mendatang) yang ditarik dari data operasional yang sudah ada.
- Ganti kartu attention mock dengan "Perlu perhatian" nyata (paket hampir habis,
  pending payment lama, no-show terbaru).
- Pindahkan AI Demo Summary ke Overview; hapus placeholder AI intelligence.

**P2 — Penyempurnaan:**
- Wujudkan Settings nyata (kelola user & peran) — kapabilitas auth sudah ada.
- Bahasa bisnis pada semua kartu metric (buang istilah teknis).
- Filter "Hari ini / Minggu ini" di Appointments.
- Ringkasan arus kas (paid/pending/cancelled bulan ini) di Payments.
- Utilisasi praktisi nyata di Practitioners & Overview.

---

## 5. Daftar "Hapus / Tata Ulang / Tambah" (ringkas)

**Hapus dari tampilan owner:**
- Artefak Loading/"Mock load failure"/"Permission required" di semua halaman mock.
- Kartu *AI intelligence* placeholder di Overview.
- Kartu attention mock yang menyangkut fitur belum-ada (WhatsApp blast, Reminder
  delivery, Open Chat Interventions).
- Semua label/teks bermuatan "Mock".
- (Sementara) entri menu untuk modul yang belum dibangun, atau pindah ke grup
  "Segera hadir".

**Tata ulang:**
- Overview: KPI nyata di atas → grafik Revenue vs Klien Baru (penuh) → "Perlu
  perhatian" + "Aktivitas terbaru" → utilisasi praktisi.
- Pindah AI Demo Summary dari Appointments ke Overview.
- Ganti bahasa teknis kartu metric (semua halaman nyata) ke bahasa bisnis.
- Rapikan tab Executive Command di topbar.

**Tambah:**
- Grafik **Pendapatan vs Klien Baru per bulan** (inti permintaan owner).
- KPI nyata: pendapatan bln ini, klien baru, pending payment (nilai), appointment
  mendatang.
- "Perlu perhatian": paket sisa sesi rendah, pending payment lama, no-show.
- Settings nyata (manajemen user & peran).

---

## 6. Catatan Penutup

Fondasi operasional (appointments, clients, practitioners, services, packages,
client-packages, payments) sudah **nyata, aman, dan terkontrol** — ini aset terbesar
produk. Pekerjaan rumah utama bukan menambah fitur baru, melainkan **(a) menyembunyikan
yang belum jadi agar tidak terlihat palsu/rusak, dan (b) mengangkat data nyata yang
sudah ada ke Overview sebagai cockpit owner**, dipimpin grafik Pendapatan vs Klien Baru
per bulan. Dengan dua langkah itu, aplikasi langsung terasa seperti produk bisnis yang
matang di mata owner.
