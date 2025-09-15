import { User as SupabaseUser } from '@supabase/supabase-js';

export type Role = 'Administrador' | 'Estudiante' | 'Barbero';

export interface User extends SupabaseUser {
  // Override the id to ensure it's always a string
  id: string;
  // Custom fields
  uid: string;
  nombre: string;
  email: string;
  role: Role;
  habilitado: boolean;
  fotoPerfil?: string;
  telefono?: string;
  direccion?: string;
  fechaRegistro?: Date;
  // Keep a reference to the original Supabase user
  supabaseUser?: SupabaseUser;
}

export interface Leccion {
  id: string;
  titulo: string;
  descripcion?: string;
  url: string;
  tipo: 'video' | 'documento' | 'texto';
  orden: number;
  curso_id: string;
  creado_en?: string;
  duracion?: number; // en minutos
}

export interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  imagenPortadaUrl?: string;
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado' | string;
  duracion: number; // en horas
  precio: number;
  publicado: boolean;
  fechaCreacion: Date;
  fecha_creacion?: string;
  actualizado_en?: string;
  instructorId: string;
  instructor_id?: string;
  categoria: string;
  categorias: string[];
  lecciones?: Leccion[];
  lecciones_count?: { count: number }[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
