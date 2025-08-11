import { useEffect, useRef } from 'react';
import authService from '../services/auth.service';

// --- UPDATED: The hook now accepts a function as an argument ---
const useWebSocketNotifications = (onSessionTerminated: (message: string) => void): void => {
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // ... (the connection logic at the top remains the same)
        const token = authService.getCurrentUserToken();
        if (!token) return;
        const wsUrl = `ws://localhost:8000/api/ws/notifications?token=${token}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        const handleMessage = (event: MessageEvent) => {
            console.log('WebSocket message received:', event.data);
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'force_logout') {
                    // --- UPDATED: Instead of alert(), call the callback function ---
                    onSessionTerminated(message.message || 'Your session has been terminated by an administrator.');

                    // No longer need to call logout/reload here, the modal will handle it.
                    // authService.logout();
                    // window.location.reload();
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        // ... (the rest of the hook with addEventListener and cleanup remains the same)
        ws.addEventListener('open', () => console.log('✅ WebSocket connection for notifications established.'));
        ws.addEventListener('message', handleMessage);
        // ...etc
        return () => {
            ws.close();
        };
    }, [onSessionTerminated]); // Add onSessionTerminated to the dependency array
};

export default useWebSocketNotifications;