import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { ConsoleShell } from "@/components/layout/console-shell";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <ConsoleShell user={user}>{children}</ConsoleShell>;
}
