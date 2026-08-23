import { redirect } from "next/navigation";

export default function GlobalCalendarRedirect() {
  redirect("/dashboard/my-work/calendar");
}
