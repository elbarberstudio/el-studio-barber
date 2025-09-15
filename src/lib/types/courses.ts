import { Curso as BaseCurso } from './auth';

export type Nivel = 'Principiante' | 'Intermedio' | 'Avanzado';

export interface Leccion {
  id: string;
  titulo: string;
  descripcion?: string;
  url: string;
  tipo: 'video' | 'documento' | 'texto';
  orden: number;
  curso_id: string;
  creado_en?: string;
  duracion?: number;
}

// Base course interface with all possible fields
export interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  nivel: Nivel;
  duracion: number;
  precio: number;
  publicado: boolean;
  fechaCreacion: Date;
  instructorId: string;
  categoria: string;
  categorias: string[];
  imagenPortadaUrl: string;
  material_url?: string | null;
  video_url?: string | null;
  creado_en?: string;
  fecha_actualizacion?: string | null;
  numeroDeLecciones: number;
  lecciones?: Leccion[];
}

export interface CursoFormData extends Omit<Curso, 'id' | 'fechaCreacion' | 'lecciones' | 'numeroDeLecciones'> {
  id?: string;
  imagen?: File | string;
}

export const NIVELES: Nivel[] = ['Principiante', 'Intermedio', 'Avanzado'];

export const CATEGORIAS = [
  'Corte de Cabello',
  'Barba y Bigote',
  'Tintes',
  'Tratamientos',
  'Estilismo',
  'Técnicas Avanzadas',
  'Gestión de Negocio',
  'Marketing',
];

export const TIPOS_ARCHIVO_PERMITIDOS = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'video/*': ['.mp4', '.webm', '.mov'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};
