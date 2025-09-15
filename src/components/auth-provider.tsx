
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Spinner } from './spinner';
import { 
  User as AppUser, 
  Role, 
  LoginCredentials, 
  RegisterCredentials 
} from '@/lib/types/auth';

interface AuthContextType {
  user: (AppUser & { supabaseUser?: SupabaseUser }) | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<AppUser>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Roles válidos en la aplicación
const VALID_ROLES: Role[] = ['Estudiante', 'Barbero'];

// Función consistente para capitalizar y validar roles
const formatRole = (s: string): Role => {
    if (typeof s !== 'string' || s.length === 0) return 'Estudiante'; // Rol por defecto
    const lowercased = s.toLowerCase();
    const capitalized = lowercased.charAt(0).toUpperCase() + lowercased.slice(1) as Role;
    
    // Asegurarse de que el rol devuelto sea uno de los válidos
    if (VALID_ROLES.includes(capitalized)) {
        return capitalized;
    }
    return 'Estudiante'; // Fallback a un rol por defecto si no es válido
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(AppUser & { supabaseUser?: SupabaseUser }) | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Escuchar cambios en la sesión de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData && !error) {
            const role = formatRole(userData.rol || 'estudiante');
            const habilitado = userData.habilitado === true;

            // Create a complete Supabase user object with all required fields
            const supabaseUser = {
              ...session.user,
              id: session.user.id,
              app_metadata: session.user.app_metadata || {},
              user_metadata: session.user.user_metadata || {},
              aud: session.user.aud || 'authenticated',
              created_at: session.user.created_at || new Date().toISOString(),
              updated_at: session.user.updated_at || new Date().toISOString(),
            };

            const appUser: AppUser = {
              ...supabaseUser,
              uid: session.user.id,
              id: session.user.id,
              nombre: userData.nombre || session.user.user_metadata?.full_name || 'Usuario',
              email: session.user.email!,
              role: role,
              habilitado: habilitado,
              fotoPerfil: userData.foto_perfil || session.user.user_metadata?.avatar_url,
              fechaRegistro: new Date(userData.fecha_registro || new Date().toISOString()),
              supabaseUser: supabaseUser,
            };

            setUser(appUser);

            // Redirección post-login/refresh
            if (pathname === '/' || pathname === '/pending-approval') {
              if (appUser.habilitado || appUser.role === 'Barbero') {
                router.push('/dashboard');
              } else {
                router.push('/pending-approval');
              }
            }
          } else {
            console.warn("Usuario no encontrado en la base de datos:", error);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, pathname]);

  const getUserAndRedirect = async (userId: string) => {
    try {
      console.log('Obteniendo sesión actual...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Error de sesión:', sessionError);
        throw new Error('No hay sesión activa');
      }

      console.log('Sesión obtenida, usuario autenticado:', session.user?.id);
      
      // Usar la sesión para obtener el perfil del usuario
      const { data: userData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error al obtener el perfil:', profileError);
        // Si hay un error al obtener el perfil, redirigir a la página de error
        router.push('/auth/error');
        return;
      }

      if (!userData) {
        console.error('Perfil no encontrado para el usuario:', session.user.id);
        // Si no se encuentra el perfil, redirigir a la página de creación de perfil
        router.push('/complete-profile');
        return;
      }

      console.log('Perfil obtenido:', userData);
      const userRole = formatRole(userData.rol || 'Estudiante');
      const habilitado = userData.habilitado === true;
      
      // Create a complete Supabase user object with all required fields
      const supabaseUser = {
        ...session.user,
        id: session.user.id,
        app_metadata: session.user.app_metadata || {},
        user_metadata: session.user.user_metadata || {},
        aud: session.user.aud || 'authenticated',
        created_at: session.user.created_at || new Date().toISOString(),
        updated_at: session.user.updated_at || new Date().toISOString(),
      };

      // Update the user state with all required fields
      const appUser: AppUser = {
        ...supabaseUser,
        uid: session.user.id,
        id: session.user.id,
        nombre: userData.nombre || session.user.user_metadata?.full_name || 'Usuario',
        email: session.user.email!,
        role: userRole,
        habilitado,
        fotoPerfil: userData.foto_perfil || session.user.user_metadata?.avatar_url,
        fechaRegistro: new Date(userData.fecha_registro || new Date().toISOString()),
        supabaseUser: supabaseUser,
      };

      setUser(appUser);
      
      // Redirigir según el rol y estado
      if (habilitado || userRole === 'Barbero' || userRole === 'Administrador') {
        console.log('Redirigiendo a /dashboard');
        router.push('/dashboard');
      } else {
        console.log('Redirigiendo a /pending-approval');
        router.push('/pending-approval');
      }
      
    } catch (error: unknown) {
      console.error('Error en getUserAndRedirect:', error);
      // Redirigir a la página de error con el mensaje correspondiente
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      router.push(`/auth/error?message=${encodeURIComponent(errorMessage)}`);
    }
  }


  const login = async (credentials: LoginCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      await getUserAndRedirect(data.user.id);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      console.log('Starting registration for:', credentials.email);
      
      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.name,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');

      console.log('Auth user created:', authData.user.id);
      
      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          nombre: credentials.name,
          email: credentials.email,
          rol: 'Estudiante',
          habilitado: false,
          fecha_registro: new Date().toISOString(),
          foto_perfil: `https://i.pravatar.cc/150?u=${authData.user.id}`
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Error creating profile: ' + profileError.message);
      }

      console.log('Registration successful');
      router.push('/pending-approval');
      
    } catch (error) {
      console.error('Error en el proceso de registro:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Error al iniciar sesión con Google:', error);
      throw new Error('Error al iniciar sesión con Google');
    }

    // La redirección se manejará automáticamente a través del listener de onAuthStateChange
  };

  const updateUserProfile = (data: Partial<AppUser>) => {
    if (user) {
      setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
    }
  }

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
