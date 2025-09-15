'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { ProfileImageUploader } from './profile-image-uploader';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Cerrar</span>
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Mi Perfil</h2>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <ProfileImageUploader>
                <Avatar className="h-24 w-24 cursor-pointer">
                  <AvatarImage src={user.fotoPerfil} alt={user.nombre} />
                  <AvatarFallback>{getInitials(user.nombre)}</AvatarFallback>
                </Avatar>
              </ProfileImageUploader>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold">{user.nombre}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="text-sm text-muted-foreground">
                {user.role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
