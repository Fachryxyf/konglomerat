import type { Metadata } from "next";
import { Fingerprint, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Akses Terbatas — webgame",
  description: "Kawasan privat. Bukan untuk sembarang orang.",
  robots: { index: false, follow: false },
};

// Root "gate" for webgame.fachryxyf.com — an atmospheric restricted-access page.
// The actual app lives at /konglomerat; this page intentionally offers no link.
export default function Gate() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04070a] text-zinc-200 flex items-center justify-center px-6 selection:bg-emerald-500/30">
      {/* animated backdrop */}
      <div className="gate-grid" aria-hidden />
      <div className="gate-orb gate-float-a" style={{ width: 620, height: 620, top: "-18%", left: "-12%", background: "radial-gradient(circle, rgba(5,150,105,0.45), transparent 65%)" }} aria-hidden />
      <div className="gate-orb gate-float-b" style={{ width: 560, height: 560, bottom: "-20%", right: "-10%", background: "radial-gradient(circle, rgba(13,148,136,0.40), transparent 65%)" }} aria-hidden />
      <div className="gate-scanline" aria-hidden />
      {/* vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.7) 100%)" }} aria-hidden />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* emblem */}
        <div className="mx-auto mb-8 relative grid place-items-center w-24 h-24 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 gate-emblem">
          <Fingerprint className="w-11 h-11 text-emerald-400" strokeWidth={1.4} />
          <span className="gate-emblem-scan absolute left-3 right-3 h-[2px] rounded-full bg-emerald-300/80 shadow-[0_0_12px_2px_rgba(52,211,153,0.7)]" aria-hidden />
        </div>

        <p className="font-mono text-[11px] tracking-[0.35em] text-emerald-400/70 mb-3">KAWASAN PRIVAT</p>

        <h1 className="gate-flicker font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white">
          AKSES TERBATAS
        </h1>

        <p className="mt-5 text-sm sm:text-base leading-relaxed text-zinc-400">
          Ini bukan tempat yang bisa dimasuki sembarang orang.
          <br className="hidden sm:block" />
          Kalau kamu sampai di sini tanpa tahu jalannya — berarti memang belum waktunya.
          <span className="text-zinc-300"> Yang punya akses, sudah tahu ke mana harus pergi.</span>
        </p>

        {/* terminal line */}
        <div className="mt-8 inline-flex items-center font-mono text-[13px] text-emerald-300/90 bg-black/40 border border-emerald-500/20 rounded-md px-3 py-2">
          <span className="text-emerald-500/70 mr-1">&gt;</span>
          <span className="gate-type">memverifikasi identitas…</span>
          <span className="gate-caret" aria-hidden />
        </div>

        <div className="mt-5 gate-deny inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-rose-400/90 border border-rose-500/30 bg-rose-500/5 rounded-full px-3 py-1.5">
          <Lock className="w-3.5 h-3.5" /> Akses ditolak
        </div>

        <footer className="mt-12 text-[11px] font-mono text-zinc-600">
          webgame.fachryxyf.com — kawasan privat
        </footer>
      </div>
    </main>
  );
}
