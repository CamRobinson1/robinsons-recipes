import { redirect } from "next/navigation";
import { gateEnabled } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!gateEnabled()) redirect("/");
  const next = (await searchParams).next;
  // Only ever bounce back to a path on this site.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return <LoginForm next={target} />;
}
