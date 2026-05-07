import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, Sparkles, Wallet, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/marketplace", label: "IP", icon: Sparkles },
  { to: "/portfolio", label: "Portfolio", icon: Wallet },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <nav
        aria-label="Primary"
        className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-background/55 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-3xl supports-[backdrop-filter]:bg-background/45"
      >
        <div className="relative flex items-end justify-between px-6 pt-3">
          {items.slice(0, 2).map((item) => (
            <NavLink
              key={item.to}
              item={item}
              active={pathname === item.to}
            />
          ))}

          <Link
            to="/upload"
            aria-label="Upload"
            className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full border border-white/10 bg-ink text-ink-foreground shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-[38%] hover:scale-110 active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.7} />
          </Link>

          {items.slice(2).map((item) => (
            <NavLink
              key={item.to}
              item={item}
              active={pathname.startsWith(item.to)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  item,
  active,
}: {
  item: { to: string; label: string; icon: typeof Home };
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className={cn(
        "group flex w-16 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-all duration-300",
        active
          ? "scale-105 text-primary"
          : "text-muted-foreground hover:scale-105 hover:text-foreground",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300",
          active
            ? "bg-primary/15 shadow-[0_0_20px_rgba(59,130,246,0.25)] backdrop-blur-md"
            : "group-hover:bg-white/5",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-all duration-300",
            active && "fill-primary/10",
          )}
          strokeWidth={active ? 2.6 : 2}
        />
      </div>

      <span className="transition-opacity duration-300">
        {item.label}
      </span>
    </Link>
  );
}
