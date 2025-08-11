import { create } from 'zustand';

// Define the shape of our notification state and actions
interface NotificationState {
    message: string;
    type: 'success' | 'error';
    isOpen: boolean;
    showNotification: (message: string, type: 'success' | 'error') => void;
    hideNotification: () => void;
}

// Create the store with the correct types
export const useNotificationStore = create<NotificationState>((set) => ({
    message: '',
    type: 'success',
    isOpen: false,
    showNotification: (message, type) => {
        set({ message, type, isOpen: true });
        // Auto-hide the notification after 4 seconds
        setTimeout(() => set({ isOpen: false }), 4000);
    },
    hideNotification: () => set({ isOpen: false }),
}));