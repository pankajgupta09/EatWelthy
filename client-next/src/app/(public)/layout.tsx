import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top-left logo */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span className="text-2xl">🥗</span>
          <span className="font-bold text-xl text-green-600">EatWelthy</span>
        </Link>
      </header>

      {/* Centered card area */}
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
