'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Book, Users, PlusCircle, Loader2, MoreHorizontal, UserCheck, UserX, Trash2 } from 'lucide-react';
import { toast, useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import { CreateCourseForm } from '@/components/dashboard/create-course-form';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

// Tipos locales (UI)
type Role = 'Administrador' | 'Estudiante' | 'Barbero';

type UIUser = {
  id: string;
  uid: string;
  nombre: string;
  email: string;
  rol?: string;
  role: Role;
  habilitado: boolean;
  fechaRegistro?: Date | null;
  fotoPerfil?: string | null;
};

type UICurso = {
  id: string;
  titulo: string;
  descripcion: string;
  imagenPortadaUrl: string;
  categorias: string[];
  numeroDeLecciones: number;
  duracion: number;
  publicado: boolean;
};

const capitalize = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UIUser[]>([]);
  const [cursos, setCursos] = useState<UICurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const [isCreateCourseOpen, setCreateCourseOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      const usersList: UIUser[] = (usersData || []).map((u: any) => ({
        ...u,
        uid: u.id,
        role: (u.rol ? capitalize(u.rol) : 'Estudiante') as Role,
        habilitado: u.habilitado === true,
        fechaRegistro: u.fecha_registro ? new Date(u.fecha_registro) : null,
      }));

      setUsers(usersList.filter((u) => u.uid !== user.id));
      setStudentCount(usersList.filter((u) => u.role === 'Estudiante').length);

      // Cursos - debug and fix
      console.log('Starting to fetch courses...');
      
      try {
        // First, let's try a simple query to see if the table exists
        const { data: testData, error: testError } = await supabase
          .from('cursos')
          .select('count')
          .limit(1);
          
        console.log('Test query result:', { testData, testError });
        
        if (testError) {
          console.error('Table access error:', testError);
          setCursos([]);
          return;
        }
        
        // Now try to fetch the actual data
        const { data: cursosData, error: cursosError } = await supabase
          .from('cursos')
          .select('*')
          .order('creado_en', { ascending: false });

        console.log('Courses fetch result:', { data: cursosData, error: cursosError });

        if (cursosError) {
          console.error('Error fetching courses:', cursosError);
          setCursos([]);
        } else {
          const cursosList: UICurso[] = (cursosData || []).map((c: any) => ({
            id: c.id,
            titulo: c.titulo || 'Sin título',
            descripcion: c.descripcion || '',
            imagenPortadaUrl: c.imagen_portada_url || c.imagen_url || '',
            categorias: Array.isArray(c.categorias) ? c.categorias : ['General'],
            numeroDeLecciones: 0,
            duracion: c.duracion || 0,
            publicado: !!c.publicado,
          }));
          
          console.log('Processed courses:', cursosList);
          setCursos(cursosList);
        }
      } catch (err) {
        console.error('Error in courses section:', err);
        setCursos([]);
      }
    } catch (err: any) {
      console.error('Error al obtener datos:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'No se pudieron cargar los datos.',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCourseCreated = () => {
    fetchData();
    setCreateCourseOpen(false);
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const { error } = await supabase.from('profiles').update({ rol: newRole }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Rol actualizado.' });
      fetchData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el rol.' });
    }
  };

  const handleUserStatusChange = async (userId: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ habilitado: isEnabled }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'Éxito', description: `Usuario ${isEnabled ? 'habilitado' : 'deshabilitado'}.` });
      fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
    }
  };

  const handleCourseDeleted = (deletedCourseId: string) => {
    setCursos((prev) => prev.filter((c) => c.id !== deletedCourseId));
    toast({ title: 'Curso eliminado', description: 'Se eliminó correctamente.' });
  };

  const roleVariantMap: Record<Role, 'default' | 'secondary'> = {
    Estudiante: 'default',
    Barbero: 'secondary',
    Administrador: 'secondary',
  };

  const roles: Role[] = ['Estudiante', 'Barbero', 'Administrador'];

  const renderUserRow = (user: UIUser) => (
    <TableRow key={user.uid}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.fotoPerfil || undefined} alt={user.nombre} />
            <AvatarFallback>{getInitials(user.nombre)}</AvatarFallback>
          </Avatar>
          <span>{user.nombre}</span>
        </div>
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell><Badge variant={roleVariantMap[user.role]}>{user.role}</Badge></TableCell>
      <TableCell>
        <Badge variant={user.habilitado ? 'default' : 'secondary'}>
          {user.habilitado ? <UserCheck className="mr-1 h-3 w-3" /> : <UserX className="mr-1 h-3 w-3" />}
          {user.habilitado ? 'Activo' : 'Pendiente'}
        </Badge>
      </TableCell>
      <TableCell>
        <Switch
          checked={user.habilitado}
          onCheckedChange={(s) => handleUserStatusChange(user.uid, s)}
          aria-label={`Habilitar ${user.nombre}`}
        />
      </TableCell>
      <TableCell>{user.fechaRegistro ? format(user.fechaRegistro, 'dd/MM/yyyy') : 'N/A'}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {roles.map((role) => (
                    <DropdownMenuItem key={role} onSelect={() => handleRoleChange(user.uid, role)}>
                      {role}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Get course data to delete files
      const { data: course } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', courseId)
        .single();

      if (course) {
        // Delete files from storage
        const filesToDelete = [];
        if (course.video_url) filesToDelete.push(course.video_url);
        if (course.material_url) filesToDelete.push(course.material_url);
        if (course.imagen_url) filesToDelete.push(course.imagen_url);

        for (const fileUrl of filesToDelete) {
          try {
            const fileName = fileUrl.split('/').pop();
            if (fileName) {
              await supabase.storage.from('course-materials').remove([fileName]);
            }
          } catch (error) {
            console.error('Error deleting file:', error);
          }
        }
      }

      // Delete course from database
      const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: 'Curso eliminado',
        description: 'El curso ha sido eliminado correctamente.',
      });

      // Refresh courses list
      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el curso.',
      });
    }
  };

  const renderCourseRow = (course: UICurso) => {
    const imageUrl = (() => {
      try {
        if (!course.imagenPortadaUrl) return '/placeholder-course.jpg';
        new URL(course.imagenPortadaUrl);
        return course.imagenPortadaUrl;
      } catch {
        return '/placeholder-course.jpg';
      }
    })();

    return (
      <div key={course.id} className="relative group">
        <Link href={`/dashboard/courses/${course.id}`} className="block">
          <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
            <div className="relative h-40 bg-gray-100 dark:bg-gray-800">
              <Image
                src={imageUrl}
                alt={course.titulo}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-2">{course.titulo}</CardTitle>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{course.numeroDeLecciones} {course.numeroDeLecciones === 1 ? 'lección' : 'lecciones'}</span>
                {course.duracion > 0 && (
                  <span>{Math.round(course.duracion / 60)} min</span>
                )}
              </div>
            </CardHeader>
          </Card>
        </Link>
        
        {/* Delete button - appears on hover */}
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => handleDeleteCourse(course.id, e)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona cursos y usuarios</p>
        </div>
      </div>

      {/* Overlay de carga */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Cargando...</p>
          </div>
        </div>
      )}

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Crear Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Crea un nuevo curso para tus estudiantes
            </p>
            <Button 
              className="w-full" 
              onClick={() => setCreateCourseOpen(true)}
            >
              Crear Curso
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Administra usuarios y sus roles
            </p>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/dashboard/users'}
            >
              Ver Usuarios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gestión de Cursos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Gestión de Cursos</h2>
        {cursos.length > 0 ? (
          <div className="grid gap-4">
            {cursos.map((curso) => (
              <Card key={curso.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Book className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{curso.titulo}</h3>
                        <p className="text-muted-foreground">{curso.descripcion}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={curso.publicado ? "default" : "secondary"}>
                            {curso.publicado ? "Publicado" : "Borrador"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => window.location.href = `/dashboard/courses/${curso.id}/manage`}
                    >
                      Gestionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay cursos creados</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer curso para comenzar
              </p>
              <Button onClick={() => setCreateCourseOpen(true)}>
                Crear Primer Curso
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de creación de curso */}
      <CreateCourseForm 
        open={isCreateCourseOpen}
        onOpenChange={setCreateCourseOpen}
        onSuccess={handleCourseCreated}
      />
    </div>
  );
}
