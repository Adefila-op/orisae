import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useConnect, useAccount, useDisconnect, useBalance } from 'wagmi';
import { formatEther } from 'ethers';

interface ConnectorInfo {
  id: string;
  name: string;
  icon?: string;
}

interface WalletContextType {
  // Connection state
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Balance
  balance: number;
  isLoadingBalance: boolean;
  
  // Connectors
  availableConnectors: ConnectorInfo[];
  connect: (connectorId: string) => Promise<void>;
  disconnect: () => void;
  
  // Errors
  error: Error | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const { connect: wagmiConnect, connectors, isLoading: isConnecting, error } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  // Fetch balance
  const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
    address,
    query: { enabled: !!address }
  });
  
  const balance = useMemo(() => {
    if (!balanceData) return 0;
    return Number(formatEther(balanceData.value));
  }, [balanceData]);
  
  // Map connectors to displayable format
  const availableConnectors = useMemo<ConnectorInfo[]>(() => {
    return connectors.map((connector) => ({
      id: connector.id,
      name: connector.name || connector.id,
    }));
  }, [connectors]);
  
  const value = useMemo<WalletContextType>(() => ({
    address,
    isConnected,
    isConnecting,
    balance,
    isLoadingBalance,
    availableConnectors,
    
    connect: async (connectorId: string) => {
      const connector = connectors.find(c => c.id === connectorId);
      if (!connector) {
        throw new Error(`Connector ${connectorId} not found`);
      }
      
      // Check if already connected to this connector
      if (isConnected && address) {
        // Already connected, just return
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        wagmiConnect(
          { connector },
          {
            onSuccess: () => resolve(),
            onError: (err) => {
              // Handle "already connected" error gracefully
              if (err.message?.includes('Connector already connected') || err.message?.includes('already connected')) {
                resolve();
              } else {
                reject(err);
              }
            },
          }
        );
      });
    },
    
    disconnect: () => {
      wagmiDisconnect();
    },
    
    error: error || null,
  }), [address, isConnected, isConnecting, balance, isLoadingBalance, availableConnectors, wagmiConnect, connectors, wagmiDisconnect, error]);
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletConnection() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletConnection must be used within WalletContextProvider');
  }
  return context;
}
