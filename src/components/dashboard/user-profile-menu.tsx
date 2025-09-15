'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-accent">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.fotoPerfil} alt={user.nombre} />
            <AvatarFallback>{user.nombre ? user.nombre[0].toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user.nombre}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
