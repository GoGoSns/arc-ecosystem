import type { Invoice } from './invoiceStore';
import { calcTotals, calcRowTotal, fmtMoney } from './invoiceStore';

function fmtDate(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function walletShort(w: string): string {
  if (!w) return '';
  return `${w.slice(0, 10)}…${w.slice(-6)}`;
}

export async function downloadInvoicePDF(invoice: Invoice): Promise<void> {
  const [{ default: jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const L = 20; // left margin
  const R = W - 20; // right edge

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setTextColor('#c9a84c');
  doc.text('Arc Pay', L, 22);

  doc.setFontSize(15);
  doc.setTextColor('#111111');
  doc.text('INVOICE', R, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor('#888888');
  doc.text(invoice.invoiceNumber, R, 24, { align: 'right' });

  // Gold accent line
  doc.setDrawColor('#c9a84c');
  doc.setLineWidth(0.6);
  doc.line(L, 30, R, 30);

  // ── From / To ───────────────────────────────────────────────────────────────
  let y = 38;
  doc.setFontSize(7.5);
  doc.setTextColor('#aaaaaa');
  doc.text('FROM', L, y);
  doc.text('TO', 110, y);

  y += 5;
  doc.setFontSize(10);
  doc.setTextColor('#111111');
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.from.name || '—', L, y);
  doc.text(invoice.to.name || '—', 110, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor('#555555');
  let ly = y + 5;

  if (invoice.from.email) { doc.text(invoice.from.email, L, ly); }
  if (invoice.to.email) { doc.text(invoice.to.email, 110, ly); }
  ly += 4.5;
  if (invoice.from.wallet) { doc.text(walletShort(invoice.from.wallet), L, ly); }
  if (invoice.to.wallet) { doc.text(walletShort(invoice.to.wallet), 110, ly); }
  ly += 4.5;
  if (invoice.from.website) { doc.text(invoice.from.website, L, ly); }

  // ── Dates + Currency ────────────────────────────────────────────────────────
  y = Math.max(ly + 8, y + 22);
  doc.setFontSize(7.5);
  doc.setTextColor('#aaaaaa');
  doc.text('ISSUE DATE', L, y);
  doc.text('DUE DATE', 75, y);
  doc.text('CURRENCY', 130, y);

  y += 5;
  doc.setFontSize(9.5);
  doc.setTextColor('#111111');
  doc.text(fmtDate(invoice.issueDate), L, y);
  doc.text(fmtDate(invoice.dueDate), 75, y);
  doc.text('USDC · Base', 130, y);

  // Status badge (text)
  const statusLabel = invoice.status === 'paid' ? 'PAID' : invoice.status === 'pending' ? 'PENDING' : 'UNPAID';
  const statusColor = invoice.status === 'paid' ? '#22c55e' : invoice.status === 'pending' ? '#f59e0b' : '#ef4444';
  doc.setFontSize(8);
  doc.setTextColor(statusColor);
  doc.text(statusLabel, R, y, { align: 'right' });

  // ── Line items ──────────────────────────────────────────────────────────────
  y += 12;
  autoTable(doc, {
    startY: y,
    margin: { left: L, right: 20 },
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: invoice.items.map((it) => [
      it.description,
      it.quantity,
      `$${fmtMoney(parseFloat(it.unitPrice) || 0)}`,
      `$${fmtMoney(calcRowTotal(it.quantity, it.unitPrice))}`,
    ]),
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: {
      fillColor: [201, 168, 76],
      textColor: [10, 10, 10],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 16, halign: 'right' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
    },
  });

  // ── Totals ──────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = ((doc as any).lastAutoTable?.finalY ?? y + 30) + 6;
  const { subtotal, tax, total } = calcTotals(invoice.items, invoice.taxPercent);
  const col = 140;

  doc.setFontSize(9);
  doc.setTextColor('#666666');
  doc.text('Subtotal:', col, y);
  doc.text(`$${fmtMoney(subtotal)}`, R, y, { align: 'right' });

  if ((parseFloat(invoice.taxPercent) || 0) > 0) {
    y += 6;
    doc.text(`Tax (${invoice.taxPercent}%):`, col, y);
    doc.text(`$${fmtMoney(tax)}`, R, y, { align: 'right' });
  }

  y += 4;
  doc.setDrawColor('#dddddd');
  doc.setLineWidth(0.3);
  doc.line(col, y, R, y);

  y += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#111111');
  doc.text('Total:', col, y);
  doc.setTextColor('#c9a84c');
  doc.text(`$${fmtMoney(total)} USDC`, R, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // ── Notes ───────────────────────────────────────────────────────────────────
  if (invoice.notes.trim()) {
    y += 14;
    doc.setFontSize(7.5);
    doc.setTextColor('#aaaaaa');
    doc.text('NOTES', L, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor('#444444');
    const lines = doc.splitTextToSize(invoice.notes, R - L);
    doc.text(lines, L, y);
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  doc.setDrawColor('#eeeeee');
  doc.setLineWidth(0.3);
  doc.line(L, pageH - 14, R, pageH - 14);
  doc.setFontSize(7.5);
  doc.setTextColor('#bbbbbb');
  doc.text('Generated by Arc Pay · arcpay.app', W / 2, pageH - 8, { align: 'center' });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
