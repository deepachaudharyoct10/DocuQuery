import Link from "next/link";

const CARDS = [
  {
    href: "/upload",
    title: "Upload documents",
    description: "Add PDF, DOCX, MD, or TXT files to your library.",
  },
  {
    href: "/chat",
    title: "Ask questions",
    description: "Chat with your documents and get grounded, cited answers.",
  },
  {
    href: "/contradictions",
    title: "Review contradictions",
    description: "See conflicting statements found across your sources.",
  },
  {
    href: "/documents",
    title: "Document library",
    description: "Browse uploaded files, their status, and metadata.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">DocuQuery</h1>
      <p className="mt-2 text-neutral-500">
        Upload documents, ask questions, and detect contradictions across your sources.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-neutral-200 p-5 transition-colors hover:border-blue-400 dark:border-neutral-800"
          >
            <h2 className="font-medium">{card.title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{card.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
