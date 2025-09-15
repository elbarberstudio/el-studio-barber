"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // Ensure session is picked up, then let AuthProvider redirect
      const { data: { session } } = await supabase.auth.getSession();
      // If session exists, the AuthProvider listener will navigate to /dashboard or /pending-approval
      // As a fallback, redirect to /dashboard after a short delay
      setTimeout(() => {
        if (session) {
          router.replace("/dashboard");
        } else {
          router.replace("/");
        }
      }, 800);
    };
    run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <span>Procesando inicio de sesión...</span>
      </div>
    </div>
  );
}
