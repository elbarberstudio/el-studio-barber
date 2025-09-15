export type Material = {
  id: string;
  nombre: string;
  tipo: 'video' | 'pdf';
  url: string;
  fecha_creacion: string;
};

export type Curso = {
  id: string;
  titulo: string;
  descripcion: string;
  imagenPortadaUrl: string;
  materiales: Material[];
  publicado: boolean;
  fecha_creacion: string;
  instructor_id?: string;
};

export type CursoFormValues = {
  titulo: string;
  descripcion: string;
  publicado: boolean;
  imagen_url?: string;
  video?: File;
  material?: File;
};
