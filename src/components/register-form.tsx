'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from './auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from './spinner';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Dirección de correo electrónico no válida.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.658-3.417-11.297-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.938,44,30.418,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await register({ ...values, role: 'Estudiante' });
      // The redirection is now handled inside the register function
    } catch (error: any) {
      let description = 'Algo salió mal. Por favor, inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
      }
      toast({
        variant: 'destructive',
        title: 'Ocurrió un Error',
        description,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
        await loginWithGoogle();
       // The redirection is now handled inside the loginWithGoogle function
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Ocurrió un Error',
            description: 'Algo salió mal durante el registro con Google.',
        });
    } finally {
        setGoogleLoading(false);
    }
  }

  return (
    <div className='space-y-4'>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
            {googleLoading ? <Spinner className="mr-2" /> : <GoogleIcon className="mr-2" />}
            Continuar con Google
        </Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O continúa con tu email</span>
          </div>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="nombre@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                    {loading && <Spinner className="mr-2" />}
                    Crear Cuenta
                </Button>
            </form>
        </Form>
    </div>
  );
}
