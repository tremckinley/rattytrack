"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

const navLinks: { name: string; href: string }[] = [
  { name: "Dashboard", href: "/" },
  { name: "Legislators", href: "/legislators" },
  { name: "Meetings", href: "/meetings" },
  { name: "Youtube", href: "/youtube" }
];

export default function NavBar() {
  //Get the current URL pathname
  const pathname = usePathname();

  return (
    <nav className="flex mb-2 text-foreground w-full bg-white border-b border-foreground z-50">
      <Link href="/" className="ml-8 my-4 items-center justify-center">
        <Image
          src="/burgundy_logo.png"
          alt="capytrack logo"
          width={100}
          height={50}
          className="w-16 md:w-24 h-auto"
          priority
        />
        <span className="font-extrabold hidden md:block">CapyTrackAI</span>
      </Link>
      <Link href="/" className="md:hidden inline-block mt-4 text-capyred"></Link>
      <div className="mx-8 flex-1 flex items-end">
        <ul className="flex text-lg w-full justify-center h-full items-end">
          {navLinks.map((link, idx) => {
            const isActive = pathname.split("/")[1] === link.href.split("/")[1];
            return (
              <Link key={idx} href={link.href}>
                <li
                  className={
                    isActive
                      ? "hover:bg-gray-200 mx-4 self-end pt-4 px-4 pb-1 active-nav-link"
                      : "hover:bg-gray-200 mx-4 self-end pt-4 px-4 pb-1"
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
