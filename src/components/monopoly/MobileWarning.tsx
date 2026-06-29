import { MonitorSmartphone } from "lucide-react";
import BrandMark from "@/components/monopoly/BrandMark";

// Full-screen gate shown only on small viewports (below the `md` breakpoint).
// The board needs desktop space, so mobile play is blocked outright. Rendered in
// the root layout so it covers every screen (setup, loading, and the game).
export default function MobileWarning() {
  return (
    <div className="md:hidden fixed inset-0 z-[300] flex flex-col items-center justify-center gap-5 p-8 text-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white">
      <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <BrandMark className="w-7 h-7 text-yellow-300" /> Konglomerat
      </div>
      <MonitorSmartphone className="w-16 h-16 text-emerald-300" strokeWidth={1.5} />
      <div className="space-y-2 max-w-xs">
        <h1 className="text-xl font-bold">Tidak bisa dimainkan di mobile</h1>
        <p className="text-sm text-emerald-100/90 leading-relaxed">
          Papan permainan butuh layar lebar. Buka lagi di <strong>laptop atau desktop</strong> (atau perlebar jendela browser) untuk mulai bermain.
        </p>
      </div>
    </div>
  );
}
