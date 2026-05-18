'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

const MOCK_ADDRESS_KEY = 'arclanding:mock-wallet-address';

interface WalletContextValue {
  address: string | undefined;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  address: undefined,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | undefined>();

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[];
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            return;
          }
        } catch {}
      }
      const saved = localStorage.getItem(MOCK_ADDRESS_KEY);
      if (saved) setAddress(saved);
    };
    checkConnection();

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts[0] || undefined);
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const connect = async () => {
    if (window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
        setAddress(accounts[0]);
        return;
      } catch {}
    }
    let mockAddr = localStorage.getItem(MOCK_ADDRESS_KEY);
    if (!mockAddr) {
      const bytes = Array.from({ length: 20 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0'),
      );
      mockAddr = '0x' + bytes.join('');
      localStorage.setItem(MOCK_ADDRESS_KEY, mockAddr);
    }
    setAddress(mockAddr);
  };

  const disconnect = () => {
    localStorage.removeItem(MOCK_ADDRESS_KEY);
    setAddress(undefined);
  };

  return (
    <WalletContext.Provider value={{ address, isConnected: !!address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
