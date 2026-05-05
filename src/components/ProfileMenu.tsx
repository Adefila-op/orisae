import { useState } from "react";
import { LogOut, Crown, TrendingUp, Copy, Check } from "lucide-react";
import { useAppState } from "@/lib/use-app-state";
import { cn } from "@/lib/utils";

export function ProfileMenu() {
  const {
    signedIn,
    creatorProfileActive,
    walletAddress,
    contentOrders,
    enableCreatorProfile,
    signOut,
    getUserTransactionVolume,
  } = useAppState();

  const [isOpen, setIsOpen] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate volume from orders
  const calculatedVolume = (contentOrders || []).reduce((sum, order) => sum + order.amount, 0);

  const handleOpenMenu = async () => {
    if (!isOpen) {
      setIsLoading(true);
      const vol = await getUserTransactionVolume();
      setVolume(vol || calculatedVolume);
      setIsLoading(false);
    }
    setIsOpen(!isOpen);
  };

  const handleCreatorSwitch = async () => {
    setIsLoading(true);
    const result = await enableCreatorProfile();
    if (!result.ok) {
      // Error - show in UI but stay open
      console.error(result.reason);
    }
    setIsLoading(false);
  };

  const handleCopyWallet = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!signedIn) {
    return null;
  }

  const displayVolume = volume || calculatedVolume;
  const minRequired = 10000; // $100 in cents
  const volumePercentage = Math.min((displayVolume / minRequired) * 100, 100);
  const canCreateIP = displayVolume >= minRequired;
  const shortBy = Math.max(0, minRequired - displayVolume);

  return (
    <div className="relative">
      <button
        onClick={handleOpenMenu}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-all duration-200 hover:scale-105 hover:bg-accent active:scale-95"
        aria-label="Profile"
      >
        <svg
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl bg-card shadow-xl border border-border">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {/* User Info */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    ACCOUNT
                  </p>
                  <p className="font-semibold">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                  <button
                    onClick={handleCopyWallet}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Address
                      </>
                    )}
                  </button>
                </div>

                <div className="border-t border-border" />

                {/* Trading Volume */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    TRADING VOLUME
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-bold">
                        ${(displayVolume / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        / $100.00 needed
                      </p>
                    </div>

                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${volumePercentage}%` }}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {canCreateIP ? (
                        <span className="text-primary font-semibold">
                          ✓ Ready to create IP assets
                        </span>
                      ) : (
                        <span>
                          Buy ${(shortBy / 100).toFixed(2)} more to unlock creator features
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Creator Mode Toggle */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    CREATOR MODE
                  </p>

                  {creatorProfileActive ? (
                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 border border-primary/20">
                      <Crown className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-primary">
                        Active
                      </p>
                    </div>
                  ) : canCreateIP ? (
                    <button
                      onClick={handleCreatorSwitch}
                      disabled={isLoading}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                        "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
                        isLoading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isLoading ? "Activating..." : "Activate Creator Mode"}
                    </button>
                  ) : (
                    <div className="rounded-lg bg-secondary px-3 py-2 border border-border">
                      <p className="text-xs text-muted-foreground">
                        Unlock creator mode by reaching $100 trading volume
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border" />

                {/* Sign Out */}
                <button
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
