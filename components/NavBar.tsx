import Link from "next/link"
import Image from "next/image"

export default function NavBar() {
    return (
        <nav className="flex items-center shadow-sm py-4 mb-2 bg-background text-foreground">
        <Image
            className="ml-4"
            src='/burgundy_logo.png'
            alt='capytrack logo'
            width={100}
            height={50}
        />
        <span className="font-extrabold">CapyTrackAI</span>
            <div className="px-2">
            <Link className="mx-1 rounded-sm p-1" href="/">Home</Link>
            <Link className="mx-1 rounded-sm p-1" href="/dashboard">Dashboard</Link>
            </div>
        </nav>
    )
}