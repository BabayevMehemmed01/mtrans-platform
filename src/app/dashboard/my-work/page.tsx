import { redirect } from "next/navigation";

// "Mənim İşlərim" əsas girişi — birbaşa "My tasks" tabına yönləndirilir.
export default function MyWorkIndexPage() {
  redirect("/dashboard/my-work/tasks");
}
