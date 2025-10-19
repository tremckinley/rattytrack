// app/not-found.tsx

import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <h2>404 - Page Not Found</h2>
      <p>Could not find the requested content.</p>
      <Link href="/">Return Home</Link>
    </div>
  )
}