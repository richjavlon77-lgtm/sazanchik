"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch("/admin/api/logout", { method: "POST" });
    } catch {
      // Network hiccup — still send them to the login screen below;
      // the server session cookie will simply expire on its own.
    }
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button
      onClick={logout}
      className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:border-red-500/40 hover:text-red-400"
    >
      Выйти
    </button>
  );
}
