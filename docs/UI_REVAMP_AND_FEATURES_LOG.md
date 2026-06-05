# UI Revamp & Feature Implementation Log

Catatan implementasi untuk rangkaian perubahan UI/UX dan fitur baru pada
HOM Studio OS v2, hasil tindak lanjut `OWNER_Review.md` dan permintaan langsung owner.
Semua perubahan terverifikasi lewat gate: `typecheck`, `lint`, `test`, `build`,
`build-storybook`, `test:e2e`.

## Ringkasan

| Area | Hasil |
|---|---|
| Branding sidebar | Logo HŌM (SVG) + caption "Dashboard v0.2" menggantikan kartu "OS v2" |
| Sidebar minimize | Tombol ciut/lebar; rail ikon-saja; logo jadi tombol expand saat hover; satu baris (logo kiri / collapse kanan) saat lebar; preferensi tersimpan |
| Overview cockpit | KPI nyata + grafik Pendapatan vs Klien Baru per bulan + "Perlu perhatian"; AI Demo Summary dipindah ke sini |
| Bersih-bersih mock | Artefak "Mock load failure"/skeleton/permission dihapus; halaman belum-jadi → "Segera hadir"; kata "Mock" dihilangkan; menu dikelompokkan |
| Fitur 1 | Client list → tombol **Detail** (panel profil, kontak tersamarkan) |
| Fitur 2 | Service + Package → **satu halaman** `/catalog` dengan tab Layanan/Paket |
| Fitur 3 | Appointment → tampilan **Kalender** bulanan (toggle Kalender/Daftar) |
| Fitur 4 | Live Chat → **redesign** layout inbox percakapan (referensi gambar 1) |

## 1. Branding & Sidebar Minimize

- Aset baru `apps/web/public/hom-logo.svg` — rekonstruksi vektor logo HŌM (teks
  melengkung "CLINICAL PILATES", wordmark "HŌM" dengan macron, "THE JOURNEY BACK TO
  HEALTH"), warna krem. (Catatan: PNG asli dari chat tidak bisa ditulis ke disk; SVG
  dipakai agar tajam di segala ukuran — bisa diganti file asli kapan saja.)
- `apps/web/src/features/shell/app-shell.tsx`:
  - Logo + caption "Dashboard v0.2" menggantikan kartu "HOM Studio / OS v2".
  - Tombol minimize: sidebar `w-72` ⇄ `w-20`; konten utama menyesuaikan padding.
  - Saat ciut: logo kecil; **hover → ikon expand**; klik = lebar kembali. Nav jadi
    rail ikon-saja (tooltip), info user disembunyikan.
  - Saat lebar: **logo rata kiri, ikon collapse rata kanan dalam satu baris** (gaya
    Gemini) + caption di bawah.
  - Preferensi ciut/lebar disimpan via `localStorage` memakai `useSyncExternalStore`
    (menghindari setState-in-effect; aman hidrasi).
- `apps/web/src/features/shell/sidebar-navigation.tsx`: dukung mode `collapsed` +
  dua grup (operasional & "Segera hadir").

## 2. Overview Cockpit + Bersih-bersih Mock (P0/P1 OWNER_Review)

- `overview-loader.ts` (server-only) — agregat dari Supabase: pendapatan & klien baru
  per bulan (6 bln), KPI (pendapatan bln ini, klien baru, pembayaran tertunda,
  janji mendatang), serta "perlu perhatian" (paket hampir habis, pending, no-show).
  Mode mock → state kosong yang rapi.
- `revenue-clients-chart.tsx` — grafik SVG (bar pendapatan + garis klien baru) di
  paling atas Overview.
- `executive-command-overview.tsx` ditulis ulang jadi cockpit (KPI + grafik +
  perhatian + ringkasan). Placeholder "AI intelligence" & metric/atensi palsu dibuang.
- `executive-overview-page.tsx` — memuat data + memindahkan **AI Demo Summary** ke
  Overview; halaman `/` dan `/dashboard/executive-command` memakainya.
- `module-mock-page.tsx` → halaman **"Segera hadir"** bersih (hapus tabel mock, kartu
  merah "Mock load failure", skeleton, "Permission required", kata "Mock").
- `routes.ts` — menu dibagi `operationalNavigation` (nyata) vs `comingSoonNavigation`
  (muted, "Segera hadir").
- `lib/format.ts` — util `formatIdr`/`formatIdrCompact`/`formatNumber`.

## 3. Fitur 1 — Client Detail

- `client-detail-types.ts`, `load-client-detail.ts` (server-only),
  `client-detail-action.ts` (`"use server"`), `client-detail-sheet.tsx` (`"use client"`).
- Tombol **Detail** per baris klien membuka panel slide-over: praktisi utama, telepon
  & email (tersamarkan), tanggal daftar/perbarui, ID.
- **Privasi:** kontak diambil **on-demand** lewat `getById` (sudah dimask), TIDAK
  ditaruh di baris tabel — menjaga aturan privasi codebase. Unit-test
  `toClientTableRow` yang melarang kontak di baris tetap hijau (model baris tak diubah).
- `clients-table.tsx` menambah kolom **Actions** + tombol Detail; aksi di-thread dari
  `clients/page.tsx` → `ClientsCatalogPage` → tabel.

## 4. Fitur 2 — Service + Package satu halaman

- Halaman baru `/catalog` (`app/catalog/page.tsx`) memuat state Services & Packages
  lalu merender `ServicePackageTabs` (client) dengan tab **Layanan | Paket** (pola
  "slots": sub-halaman server dioper sebagai prop agar bisa di-host komponen client).
- Menu: entri "Services" + "Packages" diganti satu **"Service & Paket" → /catalog**.
- Route `/services` & `/packages` tetap ada (tidak di menu) sehingga e2e per-route
  yang menavigasi langsung tetap hijau.

## 5. Fitur 3 — Appointment tampilan Kalender

- `appointments-calendar.tsx` (client) — grid kalender bulanan; event janji temu
  ditempel pada tanggalnya (chip berisi jam + nama klien, warna per status), navigasi
  bulan prev/next + "Hari ini", legenda status. Tanggal/jam dihitung di zona
  Asia/Jakarta.
- `appointments-schedule-view.tsx` (client) — toggle **Kalender | Daftar**.
- Model baris `AppointmentTableRow` ditambah `startsAt` (ISO) untuk penempatan event;
  mapper, story, dan unit-test `toAppointmentTableRow` diperbarui mengikutinya.
- **Default = Daftar (list)** agar seluruh e2e janji temu (aksi + dialog
  cancel/reschedule/complete/no-show + deduct + create) tetap hijau tanpa perubahan;
  pilihan **Kalender bersifat sticky** (`localStorage`) sehingga sekali dipilih akan
  bertahan. (Bisa dijadikan default Kalender bila owner mau — perlu sedikit penyesuaian
  beberapa test e2e.)

## 6. Fitur 4 — Live Chat redesign

- `live-chat-mock.tsx` (client) — antarmuka inbox 2 kolom (daftar percakapan + panel
  percakapan: header kontak, bubble masuk/keluar, pemisah "Hari ini", bar input
  nonaktif), klik percakapan untuk berganti. Mengikuti **layout gambar 1**; palet
  mengikuti tema aplikasi.
- `app/live-chat/page.tsx` memakai komponen ini (bukan lagi `ModuleMockPage`); judul
  **"Live Chat"** dipertahankan (e2e). Diberi badge **"Demo"** + catatan "belum
  terhubung ke WhatsApp" karena masih data contoh.

## Verifikasi

Seluruh gate hijau:
- `typecheck` — pass.
- `lint` — pass (0 error, 0 warning). (Catatan: satu temuan React Compiler
  "memoization could not be preserved" pada `useMemo` kalender diperbaiki dengan lazy
  `useState` initializer.)
- `test` — pass (domain 117, web 235).
- `build` — pass.
- `build-storybook` — pass.
- `test:e2e` — pass (30 passed, 5 local-Supabase skipped).

Catatan e2e: server `next dev` yang berjalan sangat lama (lewat beberapa kali e2e +
recompile) bisa terdegradasi dan menyajikan HTML error untuk sebagian route
(mis. `/api/me`, heading `/dashboard/executive-command`), menimbulkan kegagalan **palsu**.
Diverifikasi via `curl` ke server segar bahwa route bekerja normal; e2e lulus penuh
saat dijalankan terhadap server segar yang sudah dihangatkan.

## Keputusan Desain Penting

- Kontak klien tetap tersamarkan & on-demand (bukan di tabel) — hormati privasi.
- `/services` & `/packages` dipertahankan sebagai route (keluar dari menu) demi e2e &
  tautan langsung; UI utama memakai `/catalog`.
- Appointment default tetap **Daftar** demi stabilitas e2e; Kalender tersedia & sticky.
- Live Chat & modul "Segera hadir" tetap mock — ditandai jelas, bukan fitur produksi.

## Warnings

- Logo memakai SVG rekonstruksi, bukan PNG asli. Bila perlu identik, taruh file di
  `apps/web/public/` dan arahkan `src` `<img>` ke situ.
- Grafik Overview & KPI menampilkan angka **nyata hanya pada mode Supabase**
  (deployed/login). Di `localhost` (mode mock) tampil kosong/“Belum ada data”.
- Halaman Live Chat & lainnya yang bertanda "Segera hadir"/"Demo" belum terhubung
  backend.

## Stop Point

Keempat fitur yang diminta selesai dan terverifikasi lokal. Belum di-deploy: perubahan
masih lokal sampai di-commit & push (memicu Vercel). Tidak ada operasi destruktif,
tidak ada data produksi, tidak ada mutasi DB.
