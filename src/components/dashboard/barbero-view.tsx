'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Book, PlusCircle, Settings, Eye, Trash2, Edit, Users, BarChart3, 
  Search, Filter, Calendar, Clock, Globe, FileText, UserCheck, UserX, MoreHorizontal 
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/components/ui/use-toast';
import { CreateCourseForm } from './create-course-form';
import Link from 'next/link';
import Image from 'next/image';

type Curso = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  imagen_portada_url?: string;
  categorias: string[];
  duracion: number;
  publicado: boolean;
  barbero_id: string;
  creado_en: string;
  actualizado_en: string;
  video_url?: string;
  material_url?: string;
};

type Usuario = {
  id: string;
  email: string;
  nombre?: string;
  foto_perfil?: string;
  fecha_registro: string;
  habilitado: boolean;
  rol: 'estudiante' | 'barbero' | 'administrador';
};

export function BarberoView() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isCreateCourseOpen, setCreateCourseOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [activeTab, setActiveTab] = useState('courses');

  const fetchMyCursos = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch only courses created by this barbero
      const { data: cursosData, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('barbero_id', user.id)
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error fetching my courses:', error);
        setCursos([]);
        return;
      }

      console.log('Fetched my courses:', cursosData);
      console.log('First course image fields:', cursosData?.[0] ? {
        imagen_url: cursosData[0].imagen_url,
        imagen_portada: cursosData[0].imagen_portada,
        imagen_portada_url: cursosData[0].imagen_portada_url
      } : 'No courses');
      setCursos(cursosData || []);
      
    } catch (error) {
      console.error('Error in fetchMyCursos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar tus cursos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchUsuarios = useCallback(async () => {
    try {
      setUsersLoading(true);
      
      // Try different field names for ordering
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // If created_at doesn't exist, try without ordering
      if (error && error.message?.includes('created_at')) {
        console.log('created_at field not found, trying fecha_registro...');
        const result = await supabase
          .from('profiles')
          .select('*')
          .order('fecha_registro', { ascending: false });
        data = result.data;
        error = result.error;
      }

      // If fecha_registro doesn't exist either, get all without ordering
      if (error && error.message?.includes('fecha_registro')) {
        console.log('fecha_registro field not found, getting all users...');
        const result = await supabase
          .from('profiles')
          .select('*');
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Supabase error:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Fetched users data:', data);
      console.log('Number of users found:', data?.length || 0);
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCursos();
  }, [fetchMyCursos]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsuarios();
    }
  }, [activeTab, fetchUsuarios]);

  const handleRoleChange = async (userId: string, newRole: 'estudiante' | 'barbero' | 'administrador') => {
    try {
      const { error } = await supabase.from('profiles').update({ rol: newRole }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Rol actualizado.' });
      fetchUsuarios();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el rol.' });
    }
  };

  const handleUserStatusChange = async (userId: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ habilitado: isEnabled }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'Éxito', description: `Usuario ${isEnabled ? 'habilitado' : 'deshabilitado'}.` });
      fetchUsuarios();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCourseCreated = () => {
    fetchMyCursos();
    setCreateCourseOpen(false);
  };

  const handleDeleteCourse = async (courseId: string) => {
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
              await supabase.storage.from('cursos').remove([fileName]);
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
      fetchMyCursos();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el curso.',
      });
    }
  };

  const togglePublishStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cursos')
        .update({ publicado: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `Curso ${!currentStatus ? 'publicado' : 'despublicado'} correctamente.`,
      });

      fetchMyCursos();
    } catch (error) {
      console.error('Error updating publish status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado del curso.',
      });
    }
  };

  // Filter courses based on search and status
  const filteredCursos = cursos.filter(curso => {
    const matchesSearch = curso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         curso.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && curso.publicado) ||
                         (filterStatus === 'draft' && !curso.publicado);
    return matchesSearch && matchesStatus;
  });

  const renderCourseCard = (curso: Curso) => {
    const imageUrl = curso.imagen_portada_url 
      ? (curso.imagen_portada_url.startsWith('http') 
          ? curso.imagen_portada_url 
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cursos/${curso.imagen_portada_url}`)
      : '/placeholder-course.jpg';
    
    return (
      <Card key={curso.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-[1.02]">
        <div className="relative h-48 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
          {curso.imagen_portada_url ? (
            <Image
              src={imageUrl}
              alt={curso.titulo}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                console.log('Error loading image:', imageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/80 text-center">
                <Book className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Sin imagen</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <Badge 
              variant={curso.publicado ? "default" : "secondary"}
              className={`${curso.publicado ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-white border-0 shadow-lg`}
            >
              {curso.publicado ? (
                <><Globe className="w-3 h-3 mr-1" /> Publicado</>
              ) : (
                <><FileText className="w-3 h-3 mr-1" /> Borrador</>
              )}
            </Badge>
          </div>
          
          {/* Quick actions overlay */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-2">
              <Link href={`/dashboard/courses/${curso.id}`}>
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                  <Eye className="h-3 w-3" />
                </Button>
              </Link>
              <Link href={`/dashboard/courses/${curso.id}/manage`}>
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                  <Settings className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Title and description */}
            <div>
              <h3 className="font-bold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {curso.titulo}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {curso.descripcion}
              </p>
            </div>
            
            {/* Course stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{Math.round((curso.duracion || 0) / 60)} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(curso.creado_en).toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Categories */}
            {curso.categorias && curso.categorias.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {curso.categorias.slice(0, 3).map((categoria, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                    {categoria}
                  </Badge>
                ))}
                {curso.categorias.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{curso.categorias.length - 3} más
                  </Badge>
                )}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant={curso.publicado ? "outline" : "default"}
                size="sm"
                onClick={() => togglePublishStatus(curso.id, curso.publicado)}
                className="flex-1"
              >
                {curso.publicado ? "Despublicar" : "Publicar"}
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteCourse(curso.id)}
                className="px-3"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tus cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Modern Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full">
            <Book className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Panel del Barbero</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Mis Cursos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gestiona y administra tus cursos de barbería profesional
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Mis Cursos
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gestión de Usuarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Cursos</p>
                      <p className="text-3xl font-bold">{cursos.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Book className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Publicados</p>
                      <p className="text-3xl font-bold">{cursos.filter(c => c.publicado).length}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Globe className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Borradores</p>
                      <p className="text-3xl font-bold">{cursos.filter(c => !c.publicado).length}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cursos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-0 bg-muted/50"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-3 py-2 rounded-md border bg-background text-sm"
                      >
                        <option value="all">Todos</option>
                        <option value="published">Publicados</option>
                        <option value="draft">Borradores</option>
                      </select>
                    </div>
                    
                    <Button onClick={() => setCreateCourseOpen(true)} className="shadow-lg">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Crear Curso
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Courses Grid */}
            {filteredCursos.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {filteredCursos.map(renderCourseCard)}
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Book className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    {searchTerm || filterStatus !== 'all' ? 'No se encontraron cursos' : 'No tienes cursos creados'}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Intenta ajustar tus filtros de búsqueda'
                      : 'Crea tu primer curso para comenzar a compartir tu conocimiento profesional'
                    }
                  </p>
                  {(!searchTerm && filterStatus === 'all') && (
                    <Button onClick={() => setCreateCourseOpen(true)} size="lg" className="shadow-lg">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Crear Mi Primer Curso
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Results counter */}
            {filteredCursos.length > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Mostrando {filteredCursos.length} de {cursos.length} cursos
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-8">
            {/* Users Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Total Usuarios</p>
                      <p className="text-3xl font-bold">{usuarios.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Habilitados</p>
                      <p className="text-3xl font-bold">{usuarios.filter(u => u.habilitado).length}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">Pendientes</p>
                      <p className="text-3xl font-bold">{usuarios.filter(u => !u.habilitado).length}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <UserX className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users List */}
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando usuarios...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {usuarios.map((usuario) => (
                  <Card key={usuario.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={usuario.foto_perfil || undefined} alt={usuario.nombre} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getInitials(usuario.nombre || usuario.email)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {usuario.nombre || 'Sin nombre'}
                              </h3>
                              <Badge variant={usuario.rol === 'barbero' ? 'default' : usuario.rol === 'administrador' ? 'secondary' : 'outline'}>
                                {usuario.rol}
                              </Badge>
                              <Badge variant={usuario.habilitado ? 'default' : 'destructive'}>
                                {usuario.habilitado ? (
                                  <><UserCheck className="mr-1 h-3 w-3" /> Habilitado</>
                                ) : (
                                  <><UserX className="mr-1 h-3 w-3" /> Pendiente</>
                                )}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{usuario.email}</span>
                              <span>Registrado: {new Date(usuario.fecha_registro).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={usuario.habilitado}
                            onCheckedChange={(checked) => handleUserStatusChange(usuario.id, checked)}
                            aria-label={`Habilitar ${usuario.nombre || usuario.email}`}
                          />
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem onSelect={() => handleRoleChange(usuario.id, 'estudiante')}>
                                      Estudiante
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleRoleChange(usuario.id, 'barbero')}>
                                      Barbero
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleRoleChange(usuario.id, 'administrador')}>
                                      Administrador
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create course modal */}
        <CreateCourseForm 
          open={isCreateCourseOpen}
          onOpenChange={setCreateCourseOpen}
          onSuccess={handleCourseCreated}
        />
      </div>
    </div>
  );
}
