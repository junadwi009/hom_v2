# HOM Studio OS v2 — System Description Prompt

> Gunakan dokumen ini sebagai konteks/briefing untuk AI atau developer. Menjelaskan
> SEMUA yang ada di sistem dan menandai dengan jelas mana **REAL (berfungsi, tersimpan
> ke Supabase)** dan mana **MOCK (placeholder/demo/hardcoded)**.

---

## 0. Ringkasan Produk

**HOM Studio OS v2** — operating system untuk studio **Clinical Pilates** (rehab/kesehatan).
Mengelola klien, appointment, paket/membership, pembayaran, practitioner, keuangan,
absensi tim, kasus klinis, plus administrasi (user, role, cabang, audit). Dibangun
**local-first**: jalan di atas **Supabase lokal (Docker)** untuk dev, dengan RBAC dan
audit trail penuh.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind ·
Supabase (Postgres + Auth/GoTrue + RLS) · Zod.

**Bahasa UI:** Indonesia. **Mata uang:** IDR (format `Rp`, singkat: rb/jt/M=miliar).

---

## 1. Arsitektur & Pola (REAL)

- **Auth:** Supabase Auth (email+password). Middleware `apps/web/src/proxy.ts` jalan tiap
  request: `auth.getUser()` + RPC `get_current_app_user_context()` → redirect ke `/login`
  jika tak ter-autentikasi / bukan app_user aktif.
- **Resolusi user:** `getCurrentUser()`/`getRequiredCurrentUser()` (di-`cache()` per request)
  memanggil RPC `get_current_app_user_context()` → `{ id, auth_user_id, full_name, email,
  status, roles[], permissions[] }`.
- **Mode:** dikendalikan `.env.local` (`HOM_DATA_MODE`, `HOM_AUTH_MODE` = `supabase` | `mock`).
- **Pola mutasi (konsisten di seluruh modul REAL):**
  `page.tsx` (force-dynamic, gate izin) → feature `create-*-sheet.tsx` (client, `useActionState`)
  → `create-*-action.ts` (`"use server"`, `revalidatePath`) → `lib/<area>/server/submit-*.ts`
  (Zod + gate izin) → `lib/<area>/supabase/*.ts` (wrapper) → **RPC SECURITY DEFINER**
  (auth + app_user + `private.has_permission()` gate + insert + **audit_logs** + return row).
- **RLS:** semua tabel `enable row level security`; tulis dari browser diblokir — mutasi hanya
  via RPC SECURITY DEFINER. Baca digate `private.has_permission()`.
- **Loader:** `*-loader.ts` (`server-only`) baca Supabase; gagal → kembalikan `[]`/empty state.
- **Audit:** setiap aksi sensitif menulis ke `audit_logs` (risk: low/medium/high/critical).

---

## 2. Database — REAL (≈23 tabel, semua RLS)

**Identitas & RBAC:** `app_users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `audit_logs`
**Katalog & ops:** `practitioners`, `clients`, `services`, `appointments` (+`appointment_status_history`),
`packages`, `client_packages` (+`package_usage_history`), `payments` (+`payment_status_history`)
**Modul sesi ini:** `leads`, `client_segments`, `client_tags`, `financial_entries`,
`attendance_records`, `clinical_cases`, `branches`

### RPC (REAL) — fungsi + permission gate
| RPC | Gate | Fungsi |
|---|---|---|
| `get_current_app_user_context()` | authenticated | konteks user (roles+permissions) untuk SSR |
| `create_appointment / cancel / reschedule / complete / mark_no_show` | `can_manage_appointments` (reschedule: `can_reschedule_appointments`) | siklus appointment + overlap check + history + audit |
| `assign_client_package`, `deduct_client_package_session` | `can_manage_client_packages` | assign paket & potong sesi (idempoten) |
| `create_manual_payment`, `mark_payment_paid`, `cancel_payment` | `can_manage_payments` | pembayaran manual + transisi status |
| `list_app_users`, `provision_app_user`, `set_app_user_status`, `set_app_user_roles` | `can_manage_users` | manajemen user/role (tak bisa target diri sendiri) |
| `create_client` | `can_manage_clients` | buat klien |
| `create_service`, `create_package` | `can_manage_services` | buat layanan/paket |
| `create_lead`, `create_segment`, `create_tag` | `can_manage_clients` | buat lead/segment/tag |
| `create_practitioner` | `can_manage_practitioners` | buat practitioner |
| `create_attendance_record` | `can_manage_practitioners` | catat absensi (`practitioner_id, work_date, status, check_in, check_out, note`) |
| `create_financial_entry` | `can_edit_financials` | entry income/expense (`entry_type, category, amount_idr, occurred_on, note`) |
| `create_clinical_case` | `can_manage_clinical_cases` | buat clinical case (`client_id, title, case_status, severity, summary, opened_on`) |
| `set_role_permissions` | `can_manage_roles_permissions` | ganti set permission sebuah role (super_admin dilindungi) |
| `create_branch` | `can_manage_users` | buat cabang (registry; metrik belum dimodelkan) |
| `list_audit_logs(p_limit, p_action_prefix)` | `can_view_audit_logs` | feed audit (read-only) |

### RBAC
- **Roles (enum, 8):** `super_admin`, `studio_director`, `admin_frontdesk`, `practitioner`,
  `finance_admin`, `marketing_admin`, `viewer`, `ai_agent_service`.
- **Permissions (≈30):** `can_manage_users`, `can_manage_roles_permissions`, `can_view_audit_logs`,
  `can_view/manage_clients`, `can_view/manage_practitioners`, `can_manage_services`,
  `can_view_team_attendance`, `can_view/manage_appointments`, `can_reschedule_appointments`,
  `can_manage_client_packages`, `can_view/manage_payments`, `can_view/manage_clinical_cases`,
  `can_view/edit_session_notes`, `can_request/approve_note_unlock`,
  `can_view/edit_financials`, `can_export_financial_report`, `can_approve_reimbursements`,
  `can_view_whatsapp_inbox`, `can_send_whatsapp_message`, `can_approve_whatsapp_blast`,
  `can_use_ai_business_agent`, `can_view_ai_logs`, `can_manage_knowledge`, `can_publish_knowledge`.

---

## 3. Halaman / Route — status REAL vs MOCK

### ✅ REAL (loader Supabase + server action, data tersimpan)
| Route | Isi |
|---|---|
| `/appointments` | jadwal: create/cancel/reschedule/complete/no-show + potong sesi paket |
| `/clients` | manajemen klien + create |
| `/clients/leads` · `/clients/segments` · `/clients/tags` | pipeline lead/segment/tag + create (tabel + panel detail) |
| `/catalog` · `/services` · `/packages` | katalog layanan & paket + create |
| `/client-packages` | kepemilikan paket klien + assign + riwayat pemakaian |
| `/payments` | pembayaran manual + transisi status |
| `/practitioners` | registry practitioner + create |
| `/financials` | buku besar income/expense + create *(catatan: di nav masih di grup "Segera hadir" — mismatch, padahal REAL)* |
| `/team-attendance` | absensi practitioner + create |
| `/clinical-cases` | registry kasus klinis + create |
| `/settings/user-management` | user admin: create/status/roles |
| `/settings/roles-permissions` | **Permission Matrix** (role×permission) + editor per-role (`set_role_permissions`) |
| `/settings/branch-management` | registry cabang + create (panel detail) |
| `/settings/audit-logs` | viewer audit log (read-only) |

### 🟡 MOCK / placeholder ("Segera hadir" via `ModuleMockPage`, atau redirect)
| Route | Status |
|---|---|
| `/` (Overview/Dashboard) | **MOCK penuh** — semua angka dari `buildOverviewData()` (lihat §4) |
| `/approvals` | shell "Segera hadir" (mock metrics/rows) |
| `/live-chat` | komponen `LiveChatMock` (UI WhatsApp inbox dummy) |
| `/settings/ai-management/business-agent` | shell "Segera hadir" |
| `/settings/ai-management/knowledge-studio` | shell "Segera hadir" |
| `/settings/ai-management/behavior-intelligence` | shell "Segera hadir" |
| `/dashboard/executive-command` | shell mock |
| `/ai-business-agent`, `/knowledge-studio`, `/behavior-intelligence` | **redirect** ke padanannya di `/settings/ai-management/*` |
| `/settings`, `/settings/ai-management` | **redirect** ke sub-halaman pertama |

---

## 4. Yang MOCK / belum nyata (penting dipahami)

- **Dashboard Overview (`/`)** — 100% mock dari `features/overview/overview-data.ts`
  (`buildOverviewData(period, branch)`): KPI (Revenue Hari Ini, Total Booking, Occupancy,
  Active Members, Expiring Soon, Action Needed), tabel "Kelas Perlu Perhatian", grafik
  Trend Revenue/Booking 7 hari, Alert & Action Needed, Lead Funnel, Member Risk,
  **Revenue Mix** (Membership 52% / Class Package 24% / Drop-in 12% / Private Session 8% /
  Workshop 4%, total `Rp 72,5 jt`), AI Insights. **Tidak menyentuh DB.**
- **Modul "Segera hadir"** (`modulePages.*` di `lib/mock-data.ts`): AI Business Agent,
  Knowledge Studio, Behavior Intelligence, Approvals, Live Chat, Executive Command.
- **Tombol demo** — banyak `DemoButton`/`DemoLink`/`DemoIconButton` (~100+ di seluruh UI):
  toolbar **Search**, **Filter** dropdown, **Bulk Action**, **Export**, dan aksi cepat di
  panel detail (WhatsApp/Call/Email/Reset Password/Edit/Lihat Laporan) → **hanya feedback
  visual, tidak mengubah data**. Pencarian & filter di tabel REAL pun masih presentasional.
- **Field placeholder "—" di panel detail** (data belum dimodelkan):
  - Klien: lastVisit, totalSpend, healthScore, nextBooking, riskReasons (default).
  - Cabang: Revenue/Bookings/Members/Occupancy MTD, Fasilitas (template generik).
  - Audit log: Perangkat, Lokasi (IP ada jika tercatat).
  - User: Dibuat Pada, Last Login, Password Terakhir Diubah, Akses Cabang.
- **Tab di panel detail** (Overview/Settings/Activity/Notes, dst.) — presentasional, belum
  ada konten per-tab.

---

## 5. Navigasi (sidebar)

**Operational (REAL):** Overview · Appointments · Clients (→ Client Management, Leads,
Segments, Tags) · Practitioners · Service & Paket · Client Packages · Payments ·
**Settings** → **User Management** (User Management, Roles & Permissions, Branch Management,
Audit Logs) & **AI Management** (AI Business Agent, Knowledge Studio, Behavior Intelligence).
**Segera hadir:** Live Chat · Financials · Approvals.
> Catatan: **Financials** sebenarnya REAL tapi masih tercantum di grup "Segera hadir" (mismatch nav).

---

## 6. Alur Approval (status)

Fondasi izin **REAL** ada di RBAC, **UI modul Approvals belum dibangun (mock)**:
- **WhatsApp Blast** (`can_approve_whatsapp_blast`)
- **Unlock Session Note klinis** (`can_request_note_unlock` → `can_approve_note_unlock`)
- **Reimbursement** (`can_approve_reimbursements`)
- **Publish Knowledge** (`can_publish_knowledge`) · **Export Financial Report** (`can_export_financial_report`)
Approval bisnis lain yang belum dimodelkan: refund, diskon/override harga, payroll/komisi,
freeze/cancel membership, waiver no-show, clearance kesehatan, onboarding practitioner, dll.

---

## 7. Lingkungan & Verifikasi (REAL, local dev)

- Supabase lokal (Docker): container DB `supabase_db_hom-studio-os-v2`, API `:55421`, DB `:55422`.
- Login seeded: `local.studio.director@example.invalid` / `LocalOnly-HOM-Phase4K-2026!`
  (role `studio_director`; di dev ini juga di-grant `super_admin` agar Roles & Permissions bisa diedit).
- Migrasi: `supabase migration up --local`. **Migrasi TIDAK auto-apply ke produksi** — harus manual.
- Verifikasi RPC tanpa browser: psql impersonasi user authenticated (set `request.jwt.claims`)
  dalam transaksi `rollback`.
- Cek kode: `corepack pnpm --dir apps/web typecheck && lint`. Produksi: `next build && next start`
  (~0,2–0,8 dtk/navigasi). Dev: ~2–3 dtk/navigasi (kompilasi on-demand — normal).
  Catatan: `loading.tsx`/Suspense streaming bermasalah di production build Next 16 ini (stuck di
  skeleton), sehingga skeleton navigasi tidak dipakai.

---

## 8. Ringkas: REAL vs MOCK

**REAL:** Auth+RBAC+Audit · Clients/Leads/Segments/Tags · Catalog (Services/Packages) ·
Appointments · Client Packages · Payments · Practitioners · Financials · Team Attendance ·
Clinical Cases · User Management · Roles & Permissions · Branch Management · Audit Logs.
**MOCK:** Dashboard Overview · Approvals · Live Chat · AI Business Agent · Knowledge Studio ·
Behavior Intelligence · Executive Command · semua tombol Search/Filter/Bulk/Export demo ·
sebagian field panel detail (default "—").
