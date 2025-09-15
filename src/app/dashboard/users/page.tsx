'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, UserCheck, UserX, Mail, Calendar, Settings, Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';

type Usuario = {
  id: string;
  email: string;
  nombre?: string;
  foto_perfil?: string;
  fecha_registro: string;
  habilitado: boolean;
  rol: 'estudiante' | 'barbero' | 'administrador';
};

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('fecha_registro', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched users data:', data);
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ habilitado: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsuarios(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, habilitado: !currentStatus }
            : user
        )
      );

      toast({
        title: "Usuario actualizado",
        description: `Usuario ${!currentStatus ? 'habilitado' : 'deshabilitado'} correctamente`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive",
      });
    }
  };

  const changeUserRole = async (userId: string, newRole: 'estudiante' | 'barbero') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ rol: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsuarios(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, rol: newRole }
            : user
        )
      );

      toast({
        title: "Rol actualizado",
        description: `Usuario ahora es ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios registrados en el sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-medium">{usuarios.length} usuarios</span>
        </div>
      </div>

      <div className="grid gap-4">
        {usuarios.map((usuario) => (
          <Card key={usuario.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {usuario.nombre?.charAt(0).toUpperCase() || usuario.email.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {usuario.nombre || 'Sin nombre'}
                      </h3>
                      <Badge variant={usuario.rol === 'barbero' ? 'default' : 'secondary'}>
                        {usuario.rol}
                      </Badge>
                      <Badge variant={usuario.habilitado ? 'default' : 'destructive'}>
                        {usuario.habilitado ? 'Habilitado' : 'Deshabilitado'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {usuario.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Registrado: {formatDate(usuario.fecha_registro)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Cambiar Rol */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Cambiar Rol
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cambiar Rol de Usuario</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Quieres cambiar el rol de {usuario.nombre || usuario.email} de {usuario.rol} a {usuario.rol === 'estudiante' ? 'barbero' : 'estudiante'}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => changeUserRole(usuario.id, usuario.rol === 'estudiante' ? 'barbero' : 'estudiante')}
                        >
                          Cambiar a {usuario.rol === 'estudiante' ? 'Barbero' : 'Estudiante'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Habilitar/Deshabilitar */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={usuario.habilitado ? "destructive" : "default"}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {usuario.habilitado ? (
                          <>
                            <UserX className="h-4 w-4" />
                            Deshabilitar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Habilitar
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {usuario.habilitado ? 'Deshabilitar' : 'Habilitar'} Usuario
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Estás seguro de que quieres {usuario.habilitado ? 'deshabilitar' : 'habilitar'} a {usuario.nombre || usuario.email}?
                          {usuario.habilitado && ' El usuario no podrá acceder al sistema.'}
                          {!usuario.habilitado && ' El usuario podrá acceder al sistema nuevamente.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => toggleUserStatus(usuario.id, usuario.habilitado)}
                          className={usuario.habilitado ? "bg-destructive hover:bg-destructive/90" : ""}
                        >
                          {usuario.habilitado ? 'Deshabilitar' : 'Habilitar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {usuarios.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay usuarios registrados</h3>
              <p className="text-muted-foreground">
                Los usuarios aparecerán aquí cuando se registren en el sistema.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
