import { redirect } from "next/navigation";

// "Ana Səhifə" konsepti sistemdən ləğv edilib — /dashboard artıq
// birbaşa "Mənim İşlərim" bölməsinə yönləndirir.
export default function DashboardIndexPage() {
  redirect("/dashboard/my-work");
}
