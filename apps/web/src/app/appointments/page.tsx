import { AppointmentsCatalogPage } from "@/features/appointments/appointments-catalog-page";
import { loadAppointmentsPage } from "@/features/appointments/appointments-page-loader";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const state = await loadAppointmentsPage();

  return <AppointmentsCatalogPage state={state} />;
}
