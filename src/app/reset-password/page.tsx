"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    // When user lands from email link, Supabase sets a session
    // We check if there's a session to allow resetting
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setCanReset(!!data.session);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canReset) {
      toast({
        title: "Enlace inválido o expirado",
        description: "Abre el enlace desde el correo nuevamente para restablecer tu contraseña.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Contraseña muy corta", description: "Debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Las contraseñas no coinciden", description: "Verifica los campos", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: "¡Listo!", description: "Tu contraseña fue actualizada correctamente." });
      setPassword("");
      setConfirm("");
      router.replace("/dashboard");
    } catch (error: any) {
      toast({ title: "No se pudo actualizar", description: error?.message || "Intenta otra vez.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Restablecer contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
