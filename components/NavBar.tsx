"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

const navLinks: { name: string; href: string }[] = [
  { name: "Dashboard", href: "/" },
  { name: "Legislators", href: "/legislators" },
  { name: "Meetings", href: "/meetings" },
];

export default function NavBar() {
  const [legislatorSearchValue, setLegislatorSearchValue] = useState("");

  //Get the current URL pathname
  const pathname = usePathname();

  return (
    <nav className="flex shadow-sm mb-2 bg-card text-foreground w-full">
      <Link href="/" className="ml-8 my-4 items-center justify-center">
        <Image
          src="/burgundy_logo.png"
          alt="capytrack logo"
          width={100}
          height={50}
          className="hidden md:inline-block"
          priority
        />
        <span className="font-extrabold hidden md:block">CapyTrackAI</span>
      </Link>
      <Link href="/" className="md:hidden inline-block mt-4 text-capyred">
        <FontAwesomeIcon icon={faHome} />
      </Link>
      <div className="mx-8 flex-1 flex items-end">
        <ul className="flex w-full justify-around h-full">
          {navLinks.map((link, idx) => {
            const isActive = pathname.split("/")[1] === link.href.split("/")[1];
            return (
              <Link key={idx} href={link.href}>
                <li
                  className={
                    isActive
                      ? "hover:bg-gray-200 self-end pt-4 px-4 pb-1 active-nav-link"
                      : "hover:bg-gray-200 self-end pt-4 px-4 pb-1"
                  }
                  key={link.name}
                >
                  {link.name}
                </li>
              </Link>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
