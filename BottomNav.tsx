import type { LucideIcon } from "lucide-react";
import { House, Compass, Plus, TrendingUp, User } from "lucide-react";

export type TabId = "home" | "discover" | "create" | "trends" | "profile";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "create", label: "", icon: Plus },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "profile", label: "Profile", icon: User },
];

interface BottomNavProps {
  active: TabId;
  onSelect: (id: TabId) => void;
}

/**
 * AREM fixed bottom navigation — Option A: white bar, hairline top border, no blur.
 * Active = #0A0A0A, inactive = accessible grey. The center + is a black pill — the primary action.
 */
export function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-[#E5E5E5] bg-white text-[#0A0A0A]" aria-label="Main">
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {TABS.map(({ id, label, icon: Icon }) =>
          id === "create" ? (
            <button
              key={id}
              type="button"
              aria-label="Create"
              onClick={() => onSelect(id)}
              className="flex min-h-11 min-w-11 flex-1 items-center justify-center"
            >
              <span
                className={`flex h-10 w-14 items-center justify-center rounded-full bg-[#0A0A0A] text-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform duration-150 active:scale-95 motion-reduce:transition-none ${
                  active === id ? "ring-2 ring-black/20" : ""
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={2.5} />
              </span>
            </button>
          ) : (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-current={active === id ? "page" : undefined}
              onClick={() => onSelect(id)}
              className="flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1"
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  active === id ? "text-[#0A0A0A]" : "text-nav-inactive"
                }`}
                strokeWidth={active === id ? 2.4 : 1.8}
              />
              <span
                className={`text-[11px] font-medium tracking-wide transition-colors ${
                  active === id ? "font-semibold text-[#0A0A0A]" : "text-nav-inactive"
                }`}
              >
                {label}
              </span>
              <span
                aria-hidden
                className={`h-1 w-1 rounded-full transition-opacity ${
                  active === id ? "bg-[#0A0A0A] opacity-100" : "opacity-0"
                }`}
              />
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
