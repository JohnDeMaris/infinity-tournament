'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Chrome, AlertCircle, CheckCircle2, Link2, Unlink } from 'lucide-react';
import { toast } from 'sonner';

type Provider = 'google' | 'discord';

interface ProviderInfo {
  id: Provider;
  name: string;
  icon: typeof Chrome;
  customSvg?: React.ReactNode;
}

const providers: ProviderInfo[] = [
  {
    id: 'google',
    name: 'Google',
    icon: Chrome,
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: Chrome,
    customSvg: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
];

export function ConnectedAccounts() {
  const [connectedProviders, setConnectedProviders] = useState<Set<Provider>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState<Provider | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadConnectedProviders();
  }, []);

  const loadConnectedProviders = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.identities) {
        const connected = new Set<Provider>(
          user.identities
            .map((identity) => identity.provider as Provider)
            .filter((provider) => ['google', 'discord'].includes(provider))
        );
        setConnectedProviders(connected);
      }
    } catch (error) {
      console.error('Error loading connected providers:', error);
      toast.error('Failed to load connected accounts');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleLinkAccount = async (provider: Provider) => {
    setIsLoading(provider);

    try {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings/accounts`,
        },
      });

      if (error) {
        throw error;
      }

      toast.success(`${provider} account linking initiated`);
    } catch (error: any) {
      console.error(`Error linking ${provider}:`, error);
      toast.error(error.message || `Failed to link ${provider} account`);
      setIsLoading(null);
    }
  };

  const handleUnlinkAccount = async (provider: Provider) => {
    if (connectedProviders.size <= 1) {
      toast.error('You must keep at least one authentication method connected');
      return;
    }

    setIsLoading(provider);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No user found');
      }

      const identity = user.identities?.find((id) => id.provider === provider);

      if (!identity) {
        throw new Error(`${provider} identity not found`);
      }

      const { error } = await supabase.auth.unlinkIdentity(identity);

      if (error) {
        throw error;
      }

      setConnectedProviders((prev) => {
        const next = new Set(prev);
        next.delete(provider);
        return next;
      });

      toast.success(`${provider} account disconnected successfully`);
    } catch (error: any) {
      console.error(`Error unlinking ${provider}:`, error);
      toast.error(error.message || `Failed to unlink ${provider} account`);
    } finally {
      setIsLoading(null);
    }
  };

  const isConnected = (provider: Provider) => connectedProviders.has(provider);
  const canUnlink = connectedProviders.size > 1;

  if (isInitialLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your linked authentication providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Link multiple authentication providers to your account for convenient
            sign-in options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map((provider) => {
            const connected = isConnected(provider.id);
            const Icon = provider.icon;

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
                    {provider.customSvg || <Icon className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.name}</span>
                      {connected && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {connected ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>

                {connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlinkAccount(provider.id)}
                    disabled={!canUnlink || isLoading !== null}
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    {isLoading === provider.id ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleLinkAccount(provider.id)}
                    disabled={isLoading !== null}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    {isLoading === provider.id ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {connectedProviders.size === 1 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Keep at least one method connected</AlertTitle>
          <AlertDescription>
            You must have at least one authentication method linked to your account.
            Connect another provider before disconnecting your current one.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
