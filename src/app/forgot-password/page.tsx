"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email requerido", description: "Ingresa tu correo para continuar", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "";
      const redirectTo = `${origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      toast({
        title: "Revisa tu correo",
        description: "Te enviamos un enlace para restablecer tu contraseña.",
      });
      setEmail("");
    } catch (error: any) {
      toast({
        title: "No se pudo enviar el correo",
        description: error?.message || "Intenta nuevamente en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/" className="underline">Volver al inicio</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
