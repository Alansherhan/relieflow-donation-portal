'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { portalApi } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    phoneNumber?: string;
    address?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        name: string;
        email: string;
        password: string;
        address: string;
        phoneNumber: string;
    }) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchProfile(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchProfile = async (authToken: string) => {
        try {
            const response = await portalApi.getProfile();
            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (error: unknown) {
            // Only log non-401/404 errors - 401 means session expired, 404 means user deleted (both expected)
            const axiosError = error as { response?: { status?: number } };
            if (axiosError?.response?.status !== 401 && axiosError?.response?.status !== 404) {
                console.error('Failed to fetch profile:', error);
            }
            // Clear invalid/expired token
            localStorage.removeItem('token');
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await portalApi.login(email, password);
            if (response.data.success) {
                const { token: newToken, user: userData } = response.data;
                localStorage.setItem('token', newToken);
                setToken(newToken);
                setUser(userData);
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
            if (axiosError?.response?.status === 401) {
                throw new Error('Invalid email or password');
            }
            const message = axiosError?.response?.data?.message || (error instanceof Error ? error.message : 'Login failed');
            throw new Error(message);
        }
    };

    const register = async (data: {
        name: string;
        email: string;
        password: string;
        address: string;
        phoneNumber: string;
    }) => {
        try {
            const response = await portalApi.register({
                ...data,
                role: 'public', // Portal users are always public role
            });
            if (response.data.success) {
                const { token: newToken, user: userData } = response.data;
                localStorage.setItem('token', newToken);
                setToken(newToken);
                setUser(userData);
            } else {
                throw new Error(response.data.message || 'Registration failed');
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number; data?: { message?: string; errors?: Array<{ message: string }> } } };
            const message = axiosError?.response?.data?.message 
                || axiosError?.response?.data?.errors?.[0]?.message
                || (error instanceof Error ? error.message : 'Registration failed');
            throw new Error(message);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
