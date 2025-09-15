'use client';

import { useAuth } from '@/components/auth-provider';
import { StudentView } from '@/components/dashboard/student-view';
import { BarberoView } from '@/components/dashboard/barbero-view';
import { Spinner } from '@/components/spinner';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return (
        <div className="flex h-full items-center justify-center">
            <p>Por favor, inicia sesión para ver el panel.</p>
        </div>
    )
  }

  const renderDashboard = () => {
    // Admin ES el barbero que gestiona cursos y usuarios
    // Estudiante es rol separado que solo ve cursos
    switch (user.role) {
      case 'Administrador':
        return <BarberoView />;
      case 'Barbero':
        return <BarberoView />;
      case 'Estudiante':
        return <StudentView />;
      default:
        // Mensaje de error más detallado para depuración
        return <div>Rol de usuario desconocido. Rol detectado: {user.role}</div>;
    }
  };

  return <div className="h-full w-full">{renderDashboard()}</div>;
}