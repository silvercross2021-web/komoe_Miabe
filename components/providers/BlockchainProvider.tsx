"use client";

import React from 'react';
import { 
  getDefaultConfig, 
  RainbowKitProvider, 
  darkTheme, 
  lightTheme 
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';
import { REOWN_PROJECT_ID } from '@/lib/constants';

// Création du client Query pour TanStack
const queryClient = new QueryClient();

// Configuration de Wagmi et RainbowKit
const config = getDefaultConfig({
  appName: 'KOMOE',
  projectId: REOWN_PROJECT_ID,
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://rpc-amoy.polygon.technology"),
  },
  ssr: false,
});

export function BlockchainProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted ? (
          <RainbowKitProvider
            modalSize="compact"
            theme={resolvedTheme === 'dark' ? darkTheme() : lightTheme()}
            locale="fr-FR"
          >
            {children}
          </RainbowKitProvider>
        ) : (
          <div style={{ visibility: 'hidden' }}>{children}</div>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
