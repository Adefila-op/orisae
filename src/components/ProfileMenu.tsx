import { useState } from "react";
import { LogOut, Crown, Copy, Check } from "lucide-react";
import { useAppState } from "@/lib/use-app-state";
import { cn } from "@/lib/utils";

export function ProfileMenu() {
  const {
    signedIn,
    creatorProfileActive,
    walletAddress,
    enableCreatorProfile,
    signOut,
    getUserSalesCount,
  } = useAppState();

  const [isOpen, setIsOpen] = useState(false);
  const [salesCount, setSalesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenMenu = async () => {
    if (!isOpen) {
      setIsLoading(true);
      const count = await getUserSalesCount();
      setSalesCount(count);
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

  const minRequired = 1; // Need at least 1 sale
  const canCreateIP = salesCount >= minRequired;
  const shortBy = Math.max(0, minRequired - salesCount);

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

                {/* Sales Count */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    DIGITAL PRODUCT SALES
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-bold">
                        {salesCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        / 1 needed to create IP
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {canCreateIP ? (
                        <span className="text-primary font-semibold">
                          ✓ Ready to create IP assets
                        </span>
                      ) : (
                        <span>
                          Make {shortBy} more sale{shortBy !== 1 ? 's' : ''} to unlock creator features
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
                        Make at least 1 sale to unlock creator mode
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
