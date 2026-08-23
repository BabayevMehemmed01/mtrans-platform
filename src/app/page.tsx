import { redirect } from "next/navigation";

// Root path "/" → Ana səhifə konsepti ləğv edilib, birbaşa "Mənim İşlərim"ə yönləndir
export default function RootPage() {
  redirect("/dashboard/my-work");
}
