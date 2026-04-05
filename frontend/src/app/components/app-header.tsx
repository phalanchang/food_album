"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";

interface UserInfo {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

interface AppHeaderProps {
  title: string;
  icon?: React.ReactNode;
  backHref?: string;
}

let cachedUser: UserInfo | null = null;

export default function AppHeader({ title, icon, backHref }: AppHeaderProps) {
  const [user, setUser] = useState<UserInfo | null>(cachedUser);

  useEffect(() => {
    if (cachedUser) return;
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((json) => {
        if (json?.data) {
          cachedUser = json.data;
          setUser(json.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 glass border-b border-gray-200/50 -mx-4 px-4 mb-4">
      <div className="flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          {backHref ? (
            <Link href={backHref} className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : icon ? (
            icon
          ) : null}
          <h1 className={`text-xl font-bold ${!backHref && !icon ? "gradient-text" : "text-gray-800"}`}>
            {title}
          </h1>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600 max-w-[100px] truncate">
              {user.displayName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
