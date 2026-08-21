import { redirect } from "next/navigation";

// "Mənim İşlərim" (/dashboard/my-work) — avtomatik My tasks tabına yönləndirilir.
export default function MyWorkIndexPage() {
  redirect("/dashboard/my-work/tasks");
}
