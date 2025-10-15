"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";


const navLinks: { name: string; href: string }[] = [
  { name: "Dashboard", href: "/" },
  { name: "Legislators", href: "/legislators" },
];



export default function NavBar() {
  const [legislatorSearchValue, setLegislatorSearchValue] = useState("");

  //Get the current URL pathname
  const pathname = usePathname();
 
  return (
    <nav className="flex shadow-sm mb-2 bg-card text-foreground">
      <Link href="/" className="ml-8 my-4 items-center justify-center">
        <Image
          src="/burgundy_logo.png"
          alt="capytrack logo"
          width={100}
          height={50}
          priority
        />
        <span className="font-extrabold">CapyTrackAI</span>
      </Link>
      <div className="mx-8 flex-1 flex items-end">
        <ul className="flex w-full justify-around h-full">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li className="hover:bg-gray-200 self-end pt-4 px-4" key={link.name}>
                <Link
                  href={link.href}
                  // 3. Conditionally apply a CSS class
                  className={isActive ? "active-link" : "default-link"}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
       
      </div>
    </nav>
  );
}
