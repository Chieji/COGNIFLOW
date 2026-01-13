export interface ErrorLog {
    message: string;
    stack?: string;
    componentStack?: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

class ErrorTrackingService {
    private static instance: ErrorTrackingService;
    private isInitialized = false;

    private constructor() { }

    static getInstance(): ErrorTrackingService {
        if (!ErrorTrackingService.instance) {
            ErrorTrackingService.instance = new ErrorTrackingService();
        }
        return ErrorTrackingService.instance;
    }

    init(dsn?: string) {
        if (dsn) {
            console.log('[ErrorTracking] Initialized with DSN:', dsn);
            // Initialize Sentry or other provider here
        }
        this.isInitialized = true;
    }

    logError(error: Error, componentStack?: string, metadata?: Record<string, any>) {
        const errorLog: ErrorLog = {
            message: error.message,
            stack: error.stack,
            componentStack,
            timestamp: new Date().toISOString(),
            metadata,
        };

        // In a real app, send to API/Sentry
        console.group('[ErrorTracking] Error Captured');
        console.error(errorLog.message);
        console.log('Stack:', errorLog.stack);
        if (componentStack) console.log('Component Stack:', componentStack);
        if (metadata) console.log('Metadata:', metadata);
        console.groupEnd();

        // Persist to local storage for debugging session
        this.saveToLocalHistory(errorLog);
    }

    private saveToLocalHistory(log: ErrorLog) {
        try {
            const history = JSON.parse(localStorage.getItem('error_history') || '[]');
            history.push(log);
            // Keep last 50 errors
            if (history.length > 50) history.shift();
            localStorage.setItem('error_history', JSON.stringify(history));
        } catch (e) {
            console.warn('Failed to save error to local history');
        }
    }

    getHistory(): ErrorLog[] {
        try {
            return JSON.parse(localStorage.getItem('error_history') || '[]');
        } catch {
            return [];
        }
    }
}

export const errorTracking = ErrorTrackingService.getInstance();
