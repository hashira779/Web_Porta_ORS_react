import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
// 👇 IMPORT 'AuthContextType' and 'User' from your types file
import { User, AuthContextType } from '../types';
import { getMyProfile } from '../api/api';
import authService from '../services/auth.service';
import Spinner from '../components/common/CalSpin';

// The local interface definition is now removed from this file.

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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

    const login = async (username: string, password: string) => {
        await authService.login(username, password);
        const { data } = await getMyProfile();
        setCurrentUser(data);
    };

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