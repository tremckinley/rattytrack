"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { signOut, getIsAdminAction } from "@/app/auth/actions";
import { LogOut, Shield, User } from "lucide-react";

const navLinks: { name: string; href: string }[] = [
  { name: "Dashboard", href: "/" },
  { name: "Meetings", href: "/meetings" },
  { name: "Legislators", href: "/legislators" },
  // { name: "YouTube", href: "/youtube" }
];

import GlobalSearch from "./GlobalSearch";
import UserMenu from "./UserMenu";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchRole = async (userId: string) => {
      console.log("Fetching role via server action for:", userId);
      try {
        const isAdminRole = await getIsAdminAction();
        console.log("Server action role result:", isAdminRole);
        setIsAdmin(isAdminRole);
      } catch (err) {
        console.error("Unexpected error fetching role:", err);
        setIsAdmin(false);
      }
    };

    const initAuth = async () => {
      // 1. Check current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("Found existing session for:", session.user.email);
        setUser(session.user);
        await fetchRole(session.user.id);
      } else {
        console.log("No active session found.");
      }

      // 2. Listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth event:", event, "User:", session?.user?.email);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchRole(currentUser.id);
        } else {
          setIsAdmin(false);
        }
      });

      return subscription;
    };

    const authSub = initAuth();

    return () => {
      authSub.then(sub => sub.unsubscribe());
    };
  }, [supabase, pathname]);

  return (
    <nav className="flex justify-between items-center px-4 md:px-8 py-2 text-foreground w-full bg-white border-b border-foreground z-50">
      <div className="flex items-center flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/burgundy_logo.png"
            alt="capytrack logo"
            width={100}
            height={50}
            className="w-12 md:w-16 h-auto"
            priority
          />
          <span className="font-extrabold hidden lg:block text-xl">CapyTrackAI</span>
        </Link>
      </div>

      <div className="flex-0 flex justify-center px-4">
        <ul className="flex text-lg h-full items-center">
          {navLinks.map((link, idx) => {
            const isActive = pathname.split("/")[1] === link.href.split("/")[1];
            return (
              <Link key={idx} href={link.href}>
                <li
                  className={
                    isActive
                      ? "hover:text-blue-600 mx-2 md:mx-4 px-2 py-1 active-nav-link"
                      : "hover:text-blue-600 mx-2 md:mx-4 px-2 py-1"
                  }
                >
                  {link.name}
                </li>
              </Link>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        <GlobalSearch />

        {user ? (
          <UserMenu user={user} isAdmin={isAdmin} />
        ) : (
          <Link
            href="/login"
            className="px-4 py-1.5 min-w-fit bg-rose-950 text-white rounded-full text-xs hover:bg-rose-900 transition-colors flex items-center gap-2"
          >
            <User size={16} />
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
