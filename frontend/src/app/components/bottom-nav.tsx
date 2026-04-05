"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PlusCircle, BarChart3 } from "lucide-react";

const tabs = [
  { label: "ホーム", icon: Home, href: "/" },
  { label: "カレンダー", icon: Calendar, href: "/calendar" },
  { label: "投稿", icon: PlusCircle, href: "/meals/new" },
  { label: "振り返り", icon: BarChart3, href: "/summary" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-200/50">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                active
                  ? "text-orange-500"
                  : "text-gray-400 hover:text-gray-600 active:scale-95"
              }`}
            >
              {active && (
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full" />
              )}
              <tab.icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
