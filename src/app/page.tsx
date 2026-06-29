import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akses Terbatas",
  description: "Kawasan privat.",
  robots: { index: false, follow: false },
};

function LockMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Root landing for the private hub. Deliberately minimal & elegant — no link in,
// no drama. The game lives at its own path; those who have it know the way.
export default function Gate() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0b] text-zinc-300">
      {/* a single, restrained glow */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 16%, rgba(16,185,129,0.10), transparent 72%)" }} aria-hidden />
      {/* thin frame lines for a composed, desktop feel */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" aria-hidden />

      {/* corner labels frame the wide canvas */}
      <div className="absolute top-6 left-7 inline-flex items-center gap-2 text-[11px] tracking-[0.25em] text-zinc-500">
        <LockMark /> PRIVAT
      </div>
      <div className="absolute bottom-6 right-7 text-[11px] tracking-[0.22em] text-zinc-600 font-mono">FACHRYXYF</div>

      {/* centered content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gate-fade">
        <p className="text-[11px] tracking-[0.45em] text-emerald-500/70 mb-7">KAWASAN PRIVAT</p>
        <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-zinc-100">Akses Terbatas</h1>
        <div className="mt-9 h-px w-12 bg-emerald-500/40" />
        <p className="mt-9 max-w-md text-sm sm:text-[15px] leading-relaxed text-zinc-500">
          Halaman ini tidak ditujukan untuk publik. Tanpa tautan langsung, ini memang bukan untuk Anda.
        </p>
      </div>
    </main>
  );
}
