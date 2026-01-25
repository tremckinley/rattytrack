"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks: { name: string; href: string }[] = [
  { name: "Dashboard", href: "/" },
  { name: "Meetings", href: "/meetings" },
  { name: "Legislators", href: "/legislators" },
  // { name: "YouTube", href: "/youtube" }
];

import GlobalSearch from "./GlobalSearch";

export default function NavBar() {
  //Get the current URL pathname
  const pathname = usePathname();

  return (
    <nav className="flex items-center px-4 md:px-8 py-2 text-foreground w-full bg-white border-b border-foreground z-50">
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

      <div className="flex-1 flex justify-center px-4">
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

      <div className="flex-shrink-0">
        <GlobalSearch />
      </div>
    </nav>
  );
}
