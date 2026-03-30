"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PlusCircle, User } from "lucide-react";

const tabs = [
  { label: "ホーム", icon: Home, href: "/" },
  { label: "カレンダー", icon: Calendar, href: "/calendar" },
  { label: "投稿", icon: PlusCircle, href: "/meals/new" },
  { label: "マイページ", icon: User, href: "#" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                active ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
