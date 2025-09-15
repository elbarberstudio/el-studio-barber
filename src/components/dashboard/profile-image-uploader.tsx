'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Iniciales del nombre
const getInitials = (name?: string | null): string => {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0]!)
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

interface ProfileImageUploaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onUploadSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Dada una URL pública de Supabase Storage, intenta inferir el path del objeto.
 * Ejemplos de URL:
 * - https://xxx.supabase.co/storage/v1/object/public/profile-pictures/profile-pictures/abc.jpg
 * - https://xxx.supabase.co/storage/v1/object/public/profile-pictures/abc.jpg
 *
 * Si guardaste solo la URL en DB (y no el path), esto ayuda a borrar.
 * Idealmente guardá el `path` en DB para evitar heurísticas.
 */
function extractStoragePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const u = new URL(publicUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    // buscamos "object", "public", "<bucket>", "<path...>"
    const objectIdx = parts.findIndex(p => p === 'object');
    const publicIdx = objectIdx >= 0 ? objectIdx + 1 : -1;
    const bucketIdx = publicIdx >= 0 ? publicIdx + 1 : -1;
    if (bucketIdx < 0 || !parts[bucketIdx]) return null;

    // El resto es el path dentro del bucket
    const pathParts = parts.slice(bucketIdx + 1);
    if (pathParts.length === 0) return null;

    // A veces el path viene duplicado con el nombre del bucket al inicio
    // (depende de cómo generaste la URL): profile-pictures/<file> ó <file>
    if (pathParts[0] === parts[bucketIdx]) {
      pathParts.shift();
    }
    return pathParts.join('/');
  } catch {
    return null;
  }
}

export function ProfileImageUploader({
  className,
  size = 'md',
  disabled = false,
  onUploadSuccess,
  onError,
}: ProfileImageUploaderProps) {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, message: 'Solo se permiten imágenes JPG, PNG o WebP' };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, message: 'La imagen no debe superar los 5MB' };
    }
    return { valid: true };
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: 'Error de validación',
        description: validation.message || 'Archivo no válido',
        variant: 'destructive',
      });
      // reset input para volver a elegir
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      await uploadImage(file);
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la imagen. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      onError?.(error as Error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`; // carpeta dentro del bucket

      // Intentar borrar imagen anterior si hay URL almacenada
      if (user.fotoPerfil) {
        try {
          const path = extractStoragePathFromPublicUrl(user.fotoPerfil);
          if (path) {
            await supabase.storage.from('profile-pictures').remove([path]);
          } else {
            // fallback: si no pudimos inferir path, intentamos con el último segmento
            const last = user.fotoPerfil.split('/').pop();
            if (last) {
              await supabase.storage.from('profile-pictures').remove([last]);
            }
          }
        } catch (e) {
          console.warn('No se pudo eliminar la imagen anterior:', e);
        }
      }

      // Subir nueva imagen
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error('No se pudo obtener la URL pública de la imagen');

      // Actualizar DB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_perfil: publicUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;

      // Actualizar contexto auth
      updateUserProfile({ ...user, fotoPerfil: publicUrl });

      onUploadSuccess?.(publicUrl);
      toast({ title: '¡Foto actualizada!', description: 'Tu foto de perfil se ha actualizado correctamente.' });
      return publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo actualizar la foto de perfil: ${errorMessage}`,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    if (!user?.id) return;

    try {
      setIsUploading(true);

      // Borrar del storage si tenemos URL
      if (user.fotoPerfil) {
        const path = extractStoragePathFromPublicUrl(user.fotoPerfil);
        if (path) {
          await supabase.storage.from('profile-pictures').remove([path]);
        } else {
          const last = user.fotoPerfil.split('/').pop();
          if (last) {
            await supabase.storage.from('profile-pictures').remove([last]);
          }
        }
      }

      // Quitar URL en DB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_perfil: null })
        .eq('id', user.id);
      if (updateError) throw updateError;

      // Actualizar contexto
      updateUserProfile({ ...user, fotoPerfil: '' });

      toast({ title: 'Foto eliminada', description: 'Tu foto de perfil ha sido eliminada correctamente.' });
      onUploadSuccess?.('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo eliminar la foto de perfil: ${errorMessage}`,
        variant: 'destructive',
      });
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsUploading(false);
    }
  };

  // tamaños
  const sizeClasses = {
    sm: 'h-20 w-20 text-lg',
    md: 'h-32 w-32 text-2xl',
    lg: 'h-40 w-40 text-3xl',
  } as const;

  const buttonSize = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  } as const;

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  } as const;

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <div className="relative group">
        {/* Avatar */}
        <div className="relative">
          <Avatar
            className={cn(
              'border-2 border-gray-200 dark:border-gray-700 transition-all duration-200',
              sizeClasses[size],
              isUploading && 'opacity-50'
            )}
          >
            {user?.fotoPerfil ? (
              <AvatarImage
                src={user.fotoPerfil}
                alt={user?.nombre || 'Foto de perfil'}
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-muted">
                {getInitials(user?.nombre) || <User className="h-1/2 w-1/2" />}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Overlay de carga */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Overlay acciones (hover) */}
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={disabled || isUploading}
            />

            <Button
              type="button"
              variant="secondary"
              size="icon"
              className={cn('rounded-full shadow-md', buttonSize[size], (disabled || isUploading) && 'opacity-50 cursor-not-allowed')}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <Loader2 className={cn('animate-spin', iconSize[size])} />
              ) : (
                <Upload className={iconSize[size]} />
              )}
            </Button>

            {user?.fotoPerfil && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className={cn('rounded-full shadow-md', buttonSize[size])}
                onClick={removeImage}
                disabled={disabled || isUploading}
              >
                <X className={iconSize[size]} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
