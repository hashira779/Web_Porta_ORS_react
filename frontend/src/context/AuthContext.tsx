import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { User } from '../types';
import { getMyProfile } from '../api/api';
import authService from '../services/auth.service'; // 👈 Import authService
import Spinner from '../components/common/CalSpin';

// --- UPDATED: Add login and logout functions to the context type ---
interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // This useEffect still runs on initial app load to check for an existing token
    useEffect(() => {
        const token = authService.getCurrentUserToken();
        if (token) {
            getMyProfile()
                .then(response => setCurrentUser(response.data))
                .catch(() => setCurrentUser(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // --- NEW: Login function that updates the context state ---
    const login = async (username: string, password: string) => {
        // It will throw an error on failure, which the login page can catch
        await authService.login(username, password);
        const { data } = await getMyProfile();
        setCurrentUser(data);
    };

    // --- NEW: Logout function that clears the context state ---
    const logout = () => {
        authService.logout();
        setCurrentUser(null);
    };

    const value = useMemo(() => ({
        currentUser,
        loading,
        isAuthenticated: !!currentUser,
        login,
        logout
    }), [currentUser, loading]);

    // While checking the initial token, we can show a full-screen loader
    if (loading) {
        return (
            <div className="w-screen h-screen flex justify-center items-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};