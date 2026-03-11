export function Footer() {
  return (
    <footer className="border-t border-zinc-200 px-6 py-12 mt-24">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <p className="font-bold text-lg">Antibroadcasting Inc.</p>
          <p className="text-sm text-zinc-500 mt-1">3715 Oregon Ave S #5, Minneapolis, MN 55426</p>
          <a href="tel:6128369488" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            612.836.9488
          </a>
        </div>
        <div className="flex gap-6 text-sm text-zinc-500">
          <a href="https://www.instagram.com/antibroadcasting_inc/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">Instagram</a>
          <a href="https://web.facebook.com/antibroadcasting" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">Facebook</a>
        </div>
      </div>
      <p className="text-center text-xs text-zinc-400 mt-8">
        © {new Date().getFullYear()} Antibroadcasting Inc. All rights reserved.
      </p>
    </footer>
  );
}
