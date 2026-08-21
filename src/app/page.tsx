import type { Metadata } from "next";
import DocsPage from "./DocsPage";

export const metadata: Metadata = {
  title: "Konglomerat — Panduan & Permainan",
  description:
    "Buku panduan lengkap Konglomerat: aturan dasar, properti & lelang, bank & pinjaman, pemerintahan, sampai bangkrut & penyelamatan investor.",
};

export default function Page() {
  return <DocsPage />;
}
