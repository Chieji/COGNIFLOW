import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiIcon, WifiOffIcon } from './icons';

export const OfflineIndicator: React.FC = () => {
    const isOnline = useNetworkStatus();

    if (isOnline) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg animate-pulse">
            <WifiOffIcon className="w-5 h-5 mr-2" />
            <span className="font-medium text-sm">Offline Mode</span>
        </div>
    );
};
