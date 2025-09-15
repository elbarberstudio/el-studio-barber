
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/components/auth-provider';
import { LoginForm } from '@/components/login-form';
import { RegisterForm } from '@/components/register-form';
import { Spinner } from '@/components/spinner';
import { Button } from '@/components/ui/button';

const WelcomePanel = ({
  isLoginView,
  onToggle,
}: {
  isLoginView: boolean;
  onToggle: () => void;
}) => {
  const title = isLoginView ? '¿Eres Nuevo?' : 'Bienvenido de Nuevo';
  const description = isLoginView
    ? 'Regístrate en La plataforma de aprendizaje definitiva para barberos.'
    : 'Para mantenerte conectado con nosotros, por favor inicia sesión en La plataforma de aprendizaje definitiva para barberos.';
  const buttonText = isLoginView ? 'Regístrate' : 'Inicia Sesión';

  return (
    <div className="w-full h-full bg-primary text-primary-foreground flex flex-col justify-center items-center text-center p-12">
      <motion.div
        key={isLoginView ? 'login' : 'register'}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <Image
          src="/Estudio.png"
          alt="El Studio Barberia"
          width={240}
          height={80}
          className="object-contain mb-8 invert"
          priority
        />
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="mb-8 max-w-sm">{description}</p>
        <Button variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={onToggle}>
          {buttonText}
        </Button>
      </motion.div>
    </div>
  );
};

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      if (user.habilitado || user.role === 'Barbero') {
        router.push('/dashboard');
      } else {
        router.push('/pending-approval');
      }
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }
  
  const formVariants = {
    hidden: { opacity: 0, x: isLoginView ? -50 : 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isLoginView ? -50 : 50 },
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="relative w-full max-w-4xl h-[600px] flex rounded-xl shadow-2xl overflow-hidden">
        <div className="w-1/2 h-full hidden md:flex">
          <WelcomePanel isLoginView={isLoginView} onToggle={() => setIsLoginView(!isLoginView)} />
        </div>
        <div className="w-full md:w-1/2 h-full bg-background flex flex-col justify-center p-12">
           <AnimatePresence mode="wait">
            <motion.div
              key={isLoginView ? 'login-form' : 'register-form'}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-center mb-6">
                {isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h1>
              {isLoginView ? <LoginForm /> : <RegisterForm />}
               <div className="mt-4 text-center md:hidden">
                  <Button variant="link" onClick={() => setIsLoginView(!isLoginView)}>
                    {isLoginView ? '¿No tienes una cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia Sesión'}
                  </Button>
                </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
