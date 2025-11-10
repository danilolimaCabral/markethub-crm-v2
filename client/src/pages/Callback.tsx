import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { handleCallback } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function Callback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      try {
        // Handle OAuth callback
        await handleCallback(window.location.href);
        
        // Redirect to dashboard on success
        setLocation('/');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    }

    processCallback();
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => setLocation('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Authenticating...</h1>
        <p className="text-muted-foreground">Please wait while we complete your login</p>
      </div>
    </div>
  );
}
