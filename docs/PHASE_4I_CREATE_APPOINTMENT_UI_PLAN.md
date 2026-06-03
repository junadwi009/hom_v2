# Phase 4I Create Appointment UI Plan

Status: planning only. Do not implement until the owner approves the exact UI slice.

## 1. Scope

Plan a safe create-appointment UI that calls the existing server-only `createScheduledAppointment(...)` adapter and atomic `public.create_appointment(...)` RPC.

Create only. Do not add reschedule, cancel, complete, no-show, payment, packages, clinical notes, WhatsApp, AI, or production-service work.

## 2. Entry Point

- Add one `New Appointment` button with a plus icon in the `/appointments` page header action area.
- Open a right-side sheet so the schedule remains visible while staff enter the appointment.
- Show the action only when the current user may create appointments.
- In default mock mode or unsupported auth mode, do not fake a successful save. Show a configuration-safe disabled state.

## 3. Form Fields

| Field | UI | Safety Rule |
| --- | --- | --- |
| Client | Searchable selector | Show mock-safe or approved display name only. No phone, email, or contact details. |
| Practitioner | Searchable selector | Show active practitioner display name only. No email or app-user ID. |
| Service | Searchable selector | Show active service name, category, and copied duration. Do not show payment fields. |
| Start time | Local date and time input | Convert to an ISO timestamp for the server call. Display the studio timezone clearly. |
| Source | Select | Use `admin` as the only staff-selectable Phase 4I value. Keep `import`, `whatsapp_request`, and `ai_draft` reserved for their future originating flows. |
| Operational summary | Optional textarea | Maximum 280 characters. Label it as non-clinical operational context only. Do not place it in audit metadata. |

Duration is read-only and copied from the selected active service by the RPC. Staff cannot override it.

## 4. Server-Only Submission Pattern

The client form must never import the server-only adapter directly.

Add one narrow future server action after approval:

1. Receive form data.
2. Validate with `createScheduledAppointmentInputSchema`.
3. Call `createScheduledAppointment(...)`.
4. Return a safe discriminated result without raw Supabase or database details.
5. Refresh `/appointments` after success.

Do not add a route handler, service-role client, direct table write, or client-side Supabase mutation.

## 5. Validation

- Require client, practitioner, service, and start time.
- Keep `source = admin` for staff-created appointments.
- Enforce the 280-character operational-summary limit.
- Show the copied service duration before submission.
- Treat client-side validation as convenience only. The RPC remains authoritative for permissions, catalog status, duration, overlap, history, and audit.

## 6. Safe States

| Result | UX |
| --- | --- |
| Success | Close sheet, show a short success toast, refresh the read-only schedule. |
| `APPOINTMENT_OVERLAP` | Keep entered values and show a conflict message near practitioner and start time. Do not reveal another client's details. |
| `CLIENT_UNAVAILABLE` | Ask staff to select another active client or refresh options. |
| `PRACTITIONER_UNAVAILABLE` | Ask staff to select another active practitioner or refresh options. |
| `SERVICE_UNAVAILABLE` | Ask staff to select another active service or refresh options. |
| `AUTH_REQUIRED`, `APP_USER_REQUIRED` | Show a safe sign-in or configuration message. |
| `PERMISSION_DENIED` | Show permission denied. Do not show the form as writable. |
| Unknown failure | Keep input values and show a generic retry message. Never expose raw database details. |

## 7. Selector Data Strategy

- Load selector options server-side from the existing read-only catalog repositories.
- Pass minimal option models into the form: `id`, display label, status, and service duration where needed.
- Exclude archived clients, inactive practitioners, and inactive services from selectable options.
- Keep the RPC validation even when the UI options were prefiltered.
- Do not add contact columns, clinical details, payment details, or WhatsApp content.

## 8. Tests

- Unit-test form-to-server input mapping and safe action-result mapping.
- Test required fields, maximum summary length, fixed `admin` source, and read-only copied duration.
- Test overlap UX without exposing conflicting appointment details.
- Test permission, auth, configuration, and generic error states.
- Test that mock mode cannot report a fake successful write.
- Add Storybook stories for ready, validation error, overlap, permission denied, configuration error, submitting, and success states.
- Add Playwright coverage for opening and closing the sheet and confirming that no reschedule, cancel, complete, or no-show controls appear.

## 9. Open Questions

1. Should staff-created appointments be restricted to future start times, or may authorized staff backfill past appointments?
2. Should the optional operational summary remain enabled immediately, or wait for an additional server-side text policy guard?
3. Should `New Appointment` stay hidden or appear disabled when mock mode is active?
4. Is Asia/Jakarta the locked studio timezone for the first UI slice?

## 10. Recommended Implementation Slice

Implement Phase 4I as one reviewed create-only UI slice:

1. Add minimal selector loaders and safe option models.
2. Add the narrow create-only server action.
3. Add the header button, sheet form, safe states, and success refresh.
4. Add Storybook, unit, and Playwright tests.
5. Keep mock mode as the default and never fake persistence.

Stop before any additional appointment mutation or production auth work.
