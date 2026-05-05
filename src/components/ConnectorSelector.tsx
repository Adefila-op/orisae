import { useState } from 'react';
import { useWalletConnection } from '@/lib/wallet-context';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface ConnectorSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export function ConnectorSelector({ isOpen, onClose, onConnected }: ConnectorSelectorProps) {
  const { availableConnectors, connect, isConnecting, error } = useWalletConnection();
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  const handleConnect = async (connectorId: string) => {
    try {
      setSelectedConnector(connectorId);
      await connect(connectorId);
      onConnected();
      onClose();
    } catch (err) {
      console.error('Failed to connect:', err);
      setSelectedConnector(null);
    }
  };

  const connectorDescriptions: Record<string, string> = {
    'injected': 'MetaMask, Coinbase Wallet, or other browser wallets',
    'walletConnect': 'Connect to mobile wallet apps via QR code',
    'coinbaseWallet': 'Coinbase Wallet',
    'metaMask': 'MetaMask Browser Extension',
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Connect Your Wallet</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a wallet to connect. You can use browser extensions, mobile wallets via QR code, or other Web3 wallets.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          {availableConnectors.length === 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">No wallets detected</p>
              <p className="mt-1">Install a wallet to get started:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline">MetaMask</a></li>
                <li>• <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer" className="underline">Coinbase Wallet</a></li>
                <li>• <a href="https://zerion.io" target="_blank" rel="noopener noreferrer" className="underline">Zerion</a></li>
                <li>• <a href="https://walletconnect.com" target="_blank" rel="noopener noreferrer" className="underline">WalletConnect</a></li>
              </ul>
            </div>
          ) : (
            availableConnectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector.id)}
                disabled={isConnecting && selectedConnector === connector.id}
                className="w-full rounded-lg border border-gray-300 bg-white p-4 text-left transition-all hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{connector.name}</p>
                    <p className="text-xs text-gray-500">
                      {connectorDescriptions[connector.id] || connector.name}
                    </p>
                  </div>
                  {isConnecting && selectedConnector === connector.id && (
                    <Loader2 className="ml-2 h-5 w-5 animate-spin text-purple-600" />
                  )}
                </div>
              </button>
            ))
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <p className="font-semibold">Connection failed</p>
              <p className="mt-1">{error.message}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            disabled={availableConnectors.length === 0 || isConnecting}
            className="flex-1"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Select Wallet'
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
