"use client";

import { useState } from "react";
import type { Acara, Sumbangan } from "@/types";

interface Props {
  acara: Acara;
  sumbangan: Sumbangan[];
}

function formatRupiahPlain(angka: number): string {
  return new Intl.NumberFormat("id-ID").format(angka);
}

function formatTanggalPlain(tanggal: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(tanggal));
}

export default function TombolExport({ acara, sumbangan }: Props) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  // ─── Export Excel ────────────────────────────────────────────
  async function handleExcel() {
    setLoadingExcel(true);
    try {
      const XLSX = await import("xlsx");

      const totalUang = sumbangan.reduce((s, t) => s + (t.jumlah_uang ?? 0), 0);

      // Baris data tamu
      const baris = sumbangan.map((t, i) => ({
        "No": i + 1,
        "Nama Tamu": t.nama_tamu,
        "Alamat": t.alamat ?? "-",
        "Uang (Rp)": t.jumlah_uang ?? 0,
        "Barang": t.barang ?? "-",
        "Catatan": t.catatan ?? "-",
        "Waktu": new Date(t.created_at).toLocaleString("id-ID"),
      }));

      // Baris total di bawah
      baris.push({
        "No": "" as any,
        "Nama Tamu": `TOTAL: ${sumbangan.length} tamu`,
        "Alamat": "",
        "Uang (Rp)": totalUang,
        "Barang": "",
        "Catatan": "",
        "Waktu": "",
      });

      const ws = XLSX.utils.json_to_sheet(baris);

      // Lebar kolom
      ws["!cols"] = [
        { wch: 4 }, { wch: 25 }, { wch: 20 },
        { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 18 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sumbangan");

      const namaFile = `Sumbangan_${acara.nama_acara.replace(/\s+/g, "_")}.xlsx`;
      XLSX.writeFile(wb, namaFile);
    } catch (err) {
      alert("Gagal export Excel. Coba lagi.");
      console.error(err);
    } finally {
      setLoadingExcel(false);
    }
  }

  // ─── Export PDF ──────────────────────────────────────────────
  async function handlePdf() {
    setLoadingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const totalUang = sumbangan.reduce((s, t) => s + (t.jumlah_uang ?? 0), 0);
      const marginX = 14;
      let y = 14;

      // ── Header ──
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(acara.nama_acara, marginX, y);
      y += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Tuan Rumah : ${acara.nama_tuan_rumah}`, marginX, y); y += 5;
      doc.text(`Tanggal    : ${formatTanggalPlain(acara.tanggal)}`, marginX, y); y += 5;
      doc.text(`Lokasi     : ${acara.lokasi}`, marginX, y); y += 5;
      doc.text(`Total Tamu : ${sumbangan.length} orang`, marginX, y); y += 5;
      doc.text(`Total Uang : Rp ${formatRupiahPlain(totalUang)}`, marginX, y); y += 8;

      // Garis pemisah
      doc.setDrawColor(180);
      doc.line(marginX, y, 196, y);
      y += 4;

      // ── Tabel ──
      autoTable(doc, {
        startY: y,
        head: [["No", "Nama Tamu", "Alamat", "Uang (Rp)", "Barang"]],
        body: sumbangan.map((t, i) => [
          i + 1,
          t.nama_tamu,
          t.alamat ?? "-",
          t.jumlah_uang > 0 ? `Rp ${formatRupiahPlain(t.jumlah_uang)}` : "-",
          t.barang ?? "-",
        ]),
        foot: [["", `Total: ${sumbangan.length} tamu`, "", `Rp ${formatRupiahPlain(totalUang)}`, ""]],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [180, 70, 20], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [245, 220, 180], textColor: 50, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          3: { halign: "right" },
        },
        alternateRowStyles: { fillColor: [253, 245, 230] },
      });

      // ── Footer halaman ──
      const totalHalaman = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalHalaman; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Dicetak: ${new Date().toLocaleString("id-ID")}  |  Halaman ${i} dari ${totalHalaman}`,
          marginX, 290
        );
      }

      const namaFile = `Sumbangan_${acara.nama_acara.replace(/\s+/g, "_")}.pdf`;
      doc.save(namaFile);
    } catch (err) {
      alert("Gagal export PDF. Coba lagi.");
      console.error(err);
    } finally {
      setLoadingPdf(false);
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExcel}
        disabled={loadingExcel || sumbangan.length === 0}
        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700
          disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold
          py-3 px-4 rounded-xl text-base transition-all duration-150 shadow-sm active:scale-95"
      >
        {loadingExcel ? "⏳ Menyiapkan..." : "📊 Export Excel"}
      </button>

      <button
        onClick={handlePdf}
        disabled={loadingPdf || sumbangan.length === 0}
        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700
          disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold
          py-3 px-4 rounded-xl text-base transition-all duration-150 shadow-sm active:scale-95"
      >
        {loadingPdf ? "⏳ Menyiapkan..." : "📄 Export PDF"}
      </button>
    </div>
  );
}