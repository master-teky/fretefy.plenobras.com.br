interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/50 bg-white/70 px-6 backdrop-blur-xl">
      <h1 className="text-xl font-semibold text-[#003062]">{title}</h1>
      <div className="flex items-center gap-4">
        {/* Placeholder for future user menu / notifications */}
      </div>
    </header>
  );
}