export type User = {
    uid: string;
    nombre: string;
    email: string;
    role: 'Estudiante' | 'Barbero';
    habilitado?: boolean;
    fotoPerfil?: string;
    fechaRegistro?: Date;
}

export type Curso = {
    cursoId: string;
    titulo: string;
    descripcion: string;
    creadoPor: string; // UID del admin/barbero
    categorias: string[];
    fechaCreacion: Date;
    imagenPortadaUrl: string; // URL de la imagen de portada en Storage
    // El contenido ahora es una subcolección, por lo que este campo puede ser opcional o no existir.
    contenido?: Leccion[];
}

export type Leccion = {
    leccionId: string;
    titulo: string;
    tipo: 'video' | 'pdf';
    url: string; // URL de descarga para visualización
    path: string; // Ruta en Storage para eliminación
    fechaCreacion: Date;
}

export type Progreso = {
    uid: string; // UID del alumno
    cursoId: string;
    leccionId: string; // ID del elemento de contenido
    completado: boolean;
    fechaComplecion?: Date;
}

// Mock Data - Kept for reference but the app now uses Firestore

export const usuarios: Omit<User, "password">[] = [
  { uid: 'barber001', nombre: 'Usuario Barbero', email: 'barber@studiobarber.com', role: 'Barbero', fechaRegistro: new Date(), habilitado: true },
  { uid: 'student001', nombre: 'Alex Estudiante', email: 'student@studiobarber.com', role: 'Estudiante', fechaRegistro: new Date(), habilitado: true },
];
