'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Book, Play, FileText, Clock, User, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import Image from 'next/image';

type Curso = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url?: string;
  imagen_portada_url?: string;
  categorias: string[];
  publicado: boolean;
  barbero?: {
    nombre: string;
    foto_perfil?: string;
  };
  duracion?: number;
  creado_en: string;
  barbero_id: string;
};

export function StudentView() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const fetchCursos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch courses with barbero info
      const { data: cursosData, error } = await supabase
        .from('cursos')
        .select(`
          *,
          barbero:profiles!cursos_barbero_id_fkey(nombre, foto_perfil)
        `)
        .eq('publicado', true)
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        setCursos([]);
        return;
      }

      console.log('Fetched courses:', cursosData);
      setCursos(cursosData || []);
      
    } catch (error) {
      console.error('Error in fetchCursos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los cursos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCursos();
  }, [fetchCursos]);

  // Get unique categories
  const allCategories = ['Todos', ...new Set(cursos.flatMap(curso => curso.categorias || []))];
  
  // Filter courses by category
  const filteredCursos = selectedCategory === 'Todos' 
    ? cursos 
    : cursos.filter(curso => curso.categorias?.includes(selectedCategory));

  const renderCourseCard = (curso: Curso) => {
    const imageUrl = curso.imagen_portada_url 
      ? (curso.imagen_portada_url.startsWith('http') 
          ? curso.imagen_portada_url 
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cursos/${curso.imagen_portada_url}`)
      : '/placeholder-course.jpg';
    
    return (
      <Card key={curso.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          {curso.imagen_portada_url ? (
            <Image
              src={imageUrl}
              alt={curso.titulo}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
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
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-2 flex-1">{curso.titulo}</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {curso.categorias?.[0] || 'General'}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {curso.descripcion}
          </p>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Barbero info */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              {curso.barbero?.nombre || 'Instructor'}
            </span>
          </div>
          
          {/* Course stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{Math.round((curso.duracion || 0) / 60)} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Book className="h-4 w-4" />
              <span>Curso</span>
            </div>
          </div>
          
          {/* Categories */}
          {curso.categorias && curso.categorias.length > 1 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {curso.categorias.slice(1).map((categoria, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {categoria}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Action button */}
          <Link href={`/dashboard/courses/${curso.id}`} className="block">
            <Button className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Ver Curso
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Cursos Disponibles</h1>
        <p className="text-muted-foreground">
          Descubre y aprende con nuestros cursos de barbería profesional
        </p>
      </div>

      {/* Category filters */}
      {allCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {allCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Courses grid */}
      {filteredCursos.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCursos.map(renderCourseCard)}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {selectedCategory === 'Todos' ? 'No hay cursos disponibles' : `No hay cursos en "${selectedCategory}"`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {selectedCategory === 'Todos' 
                ? 'Los instructores aún no han publicado cursos.' 
                : 'Prueba con otra categoría o vuelve más tarde.'
              }
            </p>
            {selectedCategory !== 'Todos' && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory('Todos')}
              >
                Ver todos los cursos
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats footer */}
      {filteredCursos.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {filteredCursos.length} curso{filteredCursos.length !== 1 ? 's' : ''} 
          {selectedCategory !== 'Todos' && ` en "${selectedCategory}"`}
        </div>
      )}
    </div>
  );
}
