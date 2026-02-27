import { useEffect } from 'react';
import { useAuthStore } from '@/store/authstore';

/**
 * SessionManager — mounted once in App.tsx to handle cross-tab session synchronization.
 * 
 * Responsibilities:
 * - Initializes BroadcastChannel listener for cross-tab logout sync
 * - Listens for storage events as a fallback (older browsers)
 * - Cleans up all listeners on unmount
 */
export default function SessionManager() {
    useEffect(() => {
        const cleanup = useAuthStore.getState().initCrossTabSync();
        return cleanup;
    }, []);

    // This component renders nothing — it's purely a side-effect manager
    return null;
}
