'use server';
import type { User as UserData } from './mock-data';

export type User = Omit<UserData, 'password'>;
export type Role = User['role'];
export interface LoginCredentials {
  email: string;
  password?: string;
};
export interface RegisterCredentials extends LoginCredentials {
    name: string;
    role: 'Estudiante'; // Solo se pueden registrar como estudiantes
}


// This file is being phased out in favor of Firebase Auth.
// The types are still used across the application.
