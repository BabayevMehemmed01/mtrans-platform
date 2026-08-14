import { redirect } from "next/navigation";

// Root path "/" → Dashboard-a yönləndir
export default function RootPage() {
  redirect("/dashboard");
}
