"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/upload", label: "Upload" },
  { href: "/chat", label: "Chat" },
  { href: "/contradictions", label: "Contradictions" },
  { href: "/documents", label: "Documents" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-3xl items-center gap-6 px-6 py-4">
        <Link href="/" className="text-sm font-semibold">
          DocuQuery
        </Link>
        <div className="flex gap-4 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname?.startsWith(link.href)
                  ? "font-medium text-blue-600 dark:text-blue-400"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
