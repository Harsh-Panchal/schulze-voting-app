import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Schulze Vote
        </Link>
        <nav className="flex gap-4">
          <Link
            href="/create"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Create Election
          </Link>
        </nav>
      </div>
    </header>
  );
}
