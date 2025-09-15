
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/auth-provider';
import { Spinner } from '@/components/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { ProfileModal } from '@/components/dashboard/profile-modal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !user.habilitado && user.role !== 'Barbero') {
      router.push('/pending-approval');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/Estudio.png"
              alt="El Studio Barberia"
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-xl font-bold">El Studio Barberia</h1>
        </div>
       
        <div className="ml-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.fotoPerfil} alt={user.nombre} />
              <AvatarFallback>{getInitials(user.nombre)}</AvatarFallback>
            </Avatar>
          </button>
          
          <ProfileModal 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
          />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
