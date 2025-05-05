"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { label: "Expenses",  href: "/expense"   },
  { label: "Analytics", href: "/analytics" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-background border-r text-foreground flex flex-col">
      <div className="px-6 py-4 text-2xl font-bold">
        FinanceApp
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "block px-4 py-2 rounded-lg transition " +
                (isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted hover:text-foreground")
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
