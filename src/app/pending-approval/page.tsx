
'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PendingApprovalPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.habilitado)) {
            // Si el usuario ya está habilitado o no está logueado, redirigir al dashboard/login
            router.push('/');
        }
    }, [user, loading, router]);


    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        
            <Card className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center text-center">
                <Image 
                    src="/Estudio.png" 
                    alt="El Studio Barberia" 
                    width={240}
                    height={80}
                    className="object-contain"
                    priority
                />
            </div>
                <CardHeader className="items-center text-center">
                    <ShieldCheck className="h-12 w-12 text-primary" />
                    <CardTitle className="mt-4 text-2xl">Cuenta Pendiente de Aprobación</CardTitle>
                    <CardDescription className="mt-2">
                        Gracias por registrarte, {user?.nombre?.split(' ')[0] || 'usuario'}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p>
                        Tu cuenta ha sido creada exitosamente, pero necesita ser activada antes de que puedas acceder al contenido.
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Recibirás una notificación por correo electrónico una vez que tu cuenta sea aprobada. Si tienes alguna pregunta, no dudes en contactarnos.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button onClick={logout} className="w-full">
                        Cerrar Sesión
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
