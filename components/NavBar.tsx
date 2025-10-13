"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

const navLinks: {name:string, href: string}[] = [
    {name: "Dashboard", href: "/"},
    {name: "Legislators", href: "/legislators"}
];

export default function NavBar() {
    //Get the current URL pathname
    const pathname = usePathname();
    console.log(pathname)

    return (
        <nav className="flex shadow-sm py-4 mb-2 bg-background text-foreground">
        <div className="ml-8 items-center justify-center">
        <Image
            src='/burgundy_logo.png'
            alt='capytrack logo'
            width={100}
            height={50}
        />
        <span className="font-extrabold">CapyTrackAI</span>
        </div>
        <div className="mx-8 flex-1 flex items-end">
            <ul className="flex w-full justify-around">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href
                    return (
<li className="" key={link.name}>
              <Link
                href={link.href}
                // 3. Conditionally apply a CSS class
                className={isActive ? 'active-link' : 'default-link'}
              >
                {link.name}
              </Link>
            </li>
                )})}
                 
            </ul>
            </div>
        </nav>
    )
}
