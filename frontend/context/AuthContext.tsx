'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchGraphQL } from '@/lib/graphql';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'STAFF' | 'ADMIN' | 'COLLEGE_ADMIN';
  phone?: string;
  student?: {
    id: string;
    studentId: string;
    department: string;
    semester: number;
    className: string;
  };
  staff?: {
    id: string;
    employeeId: string;
    designation: string;
    shift: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  quickSwitch: (role: 'STUDENT' | 'STAFF' | 'ADMIN') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user {
        id
        name
        email
        role
        phone
      }
    }
  }
`;

const ME_QUERY = `
  query Me {
    me {
      id
      name
      email
      role
      phone
    }
  }
`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('sq_token');
    const savedUser = localStorage.getItem('sq_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('sq_token');
        localStorage.removeItem('sq_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await fetchGraphQL(LOGIN_MUTATION, { email, password: pass });
      const { accessToken, user: loggedUser } = data.login;

      setToken(accessToken);
      setUser(loggedUser);
      localStorage.setItem('sq_token', accessToken);
      localStorage.setItem('sq_user', JSON.stringify(loggedUser));

      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (inputData: any): Promise<User> => {
    setIsLoading(true);
    try {
      const REGISTER_MUTATION = `
        mutation Register($name: String!, $email: String!, $password: String!, $role: Role, $department: String, $semester: Int, $className: String) {
          register(name: $name, email: $email, password: $password, role: $role, department: $department, semester: $semester, className: $className) {
            accessToken
            user {
              id
              name
              email
              role
              phone
            }
          }
        }
      `;
      const data = await fetchGraphQL(REGISTER_MUTATION, inputData);
      const { accessToken, user: newUser } = data.register;

      setToken(accessToken);
      setUser(newUser);
      localStorage.setItem('sq_token', accessToken);
      localStorage.setItem('sq_user', JSON.stringify(newUser));

      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sq_token');
    localStorage.removeItem('sq_user');
  };

  const quickSwitch = async (role: 'STUDENT' | 'STAFF' | 'ADMIN') => {
    const creds = {
      STUDENT: { email: 'student@canteenq.local', pass: 'Password@123' },
      STAFF: { email: 'staff@canteenq.local', pass: 'Password@123' },
      ADMIN: { email: 'admin@canteenq.local', pass: 'Password@123' },
    };
    await login(creds[role].email, creds[role].pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickSwitch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
