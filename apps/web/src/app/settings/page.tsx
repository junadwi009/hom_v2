import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Settings is a section, not a leaf page. Land on the first sub-page.
export default function SettingsPage() {
  redirect("/settings/user-management");
}
