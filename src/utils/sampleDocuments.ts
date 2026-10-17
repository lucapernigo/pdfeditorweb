import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleDocMeta {
  id: string;
  title: string;
  description: string;
  category: string;
  badge: string;
}

export const SAMPLE_DOCUMENTS: SampleDocMeta[] = [
  {
    id: 'invoice',
    title: 'Professional Service Invoice',
    description: 'Bilingual business invoice with line items, tax breakdown, and terms.',
    category: 'Finance',
    badge: 'Popular',
  },
  {
    id: 'contract',
    title: 'Independent Contractor Agreement',
    description: 'Standard NDA & services agreement with scope, clauses, and signature lines.',
    category: 'Legal',
    badge: 'Formal',
  },
  {
    id: 'certificate',
    title: 'Certificate of Achievement',
    description: 'Honorary award diploma with serif typography and distinction borders.',
    category: 'Awards',
    badge: 'Design',
  },
];

/**
 * Generates a high-quality sample PDF on-the-fly using pdf-lib
 */
export async function generateSamplePdf(sampleId: string): Promise<{ bytes: Uint8Array; filename: string }> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  if (sampleId === 'contract') {
    // Standard Letter Page: 612 x 792
    const page = pdfDoc.addPage([612, 792]);
    const { height } = page.getSize();

    // Header
    page.drawText('CONSULTING SERVICES & NON-DISCLOSURE AGREEMENT', {
      x: 54,
      y: height - 60,
      size: 15,
      font: timesBold,
      color: rgb(0.12, 0.16, 0.22),
    });

    page.drawLine({
      start: { x: 54, y: height - 72 },
      end: { x: 558, y: height - 72 },
      thickness: 1.5,
      color: rgb(0.2, 0.25, 0.35),
    });

    page.drawText('Document Reference: AGMT-2026-9844B', {
      x: 54,
      y: height - 90,
      size: 9,
      font: courier,
      color: rgb(0.35, 0.4, 0.5),
    });

    page.drawText('Effective Date: November 1, 2026', {
      x: 370,
      y: height - 90,
      size: 10,
      font: timesItalic,
      color: rgb(0.25, 0.3, 0.4),
    });

    // Preamble
    let currentY = height - 125;
    const preamble = [
      'This Consulting Agreement ("Agreement") is entered into as of the Effective Date written above,',
      'by and between Apex Systems Group LLC ("Company"), and the undersigned ("Specialist").',
      'WHEREAS, the Company desires to retain the specialized technical and advisory services',
      'of the Specialist, and the Specialist agrees to provide such services under the following terms:',
    ];

    for (const line of preamble) {
      page.drawText(line, {
        x: 54,
        y: currentY,
        size: 10.5,
        font: timesRoman,
        color: rgb(0.15, 0.18, 0.24),
      });
      currentY -= 17;
    }

    // Section 1
    currentY -= 15;
    page.drawText('1. SCOPE OF SERVICES & DELIVERABLES', {
      x: 54,
      y: currentY,
      size: 12,
      font: timesBold,
      color: rgb(0.12, 0.16, 0.22),
    });

    currentY -= 20;
    const clause1 = [
      '1.1 Technical Advisory: The Specialist shall assist in software architecture, workflow auditing,',
      '    and digital transformation strategy for client web applications.',
      '1.2 Performance Standards: All deliverables shall adhere to highest industry engineering standards.',
      '1.3 Milestone Timeline: Project phases shall be completed according to Schedule A.',
    ];
    for (const line of clause1) {
      page.drawText(line, {
        x: 54,
        y: currentY,
        size: 10,
        font: timesRoman,
        color: rgb(0.2, 0.24, 0.3),
      });
      currentY -= 16;
    }

    // Section 2: Compensation
    currentY -= 15;
    page.drawText('2. COMPENSATION & PAYMENT TERMS', {
      x: 54,
      y: currentY,
      size: 12,
      font: timesBold,
      color: rgb(0.12, 0.16, 0.22),
    });

    currentY -= 20;
    const clause2 = [
      '2.1 Retainer Fee: The Company shall remit a baseline monthly fee of $8,500 USD.',
      '2.2 Invoicing: Monthly invoices shall be submitted net 30 calendar days upon receipt.',
      '2.3 Expenses: Pre-approved travel and tooling expenses will be reimbursed promptly.',
    ];
    for (const line of clause2) {
      page.drawText(line, {
        x: 54,
        y: currentY,
        size: 10,
        font: timesRoman,
        color: rgb(0.2, 0.24, 0.3),
      });
      currentY -= 16;
    }

    // Signature Block
    currentY = 160;
    page.drawText('IN WITNESS WHEREOF, the parties hereto have executed this Agreement.', {
      x: 54,
      y: currentY,
      size: 10,
      font: timesItalic,
      color: rgb(0.3, 0.35, 0.4),
    });

    currentY -= 30;
    page.drawText('FOR COMPANY: Apex Systems Group', {
      x: 54,
      y: currentY,
      size: 10.5,
      font: timesBold,
      color: rgb(0.15, 0.18, 0.25),
    });
    page.drawText('FOR SPECIALIST / RECIPIENT:', {
      x: 340,
      y: currentY,
      size: 10.5,
      font: timesBold,
      color: rgb(0.15, 0.18, 0.25),
    });

    currentY -= 40;
    page.drawLine({
      start: { x: 54, y: currentY },
      end: { x: 260, y: currentY },
      thickness: 1,
      color: rgb(0.6, 0.65, 0.7),
    });
    page.drawLine({
      start: { x: 340, y: currentY },
      end: { x: 550, y: currentY },
      thickness: 1,
      color: rgb(0.6, 0.65, 0.7),
    });

    currentY -= 15;
    page.drawText('Authorized Signature: Marcus Vance, VP', {
      x: 54,
      y: currentY,
      size: 9,
      font: timesRoman,
      color: rgb(0.4, 0.45, 0.5),
    });
    page.drawText('Authorized Signature: [Click to Sign / Fill]', {
      x: 340,
      y: currentY,
      size: 9,
      font: timesRoman,
      color: rgb(0.4, 0.45, 0.5),
    });

    return {
      bytes: await pdfDoc.save(),
      filename: 'consulting_agreement.pdf',
    };
  } else if (sampleId === 'certificate') {
    // Landscape Certificate: 792 x 612
    const page = pdfDoc.addPage([792, 612]);
    const { width, height } = page.getSize();

    // Elegant Borders
    page.drawRectangle({
      x: 25,
      y: 25,
      width: width - 50,
      height: height - 50,
      borderWidth: 2,
      borderColor: rgb(0.6, 0.48, 0.2), // Gold
      color: rgb(0.99, 0.99, 0.97),
    });

    page.drawRectangle({
      x: 35,
      y: 35,
      width: width - 70,
      height: height - 70,
      borderWidth: 0.75,
      borderColor: rgb(0.7, 0.6, 0.35),
      color: rgb(1, 1, 1),
    });

    // Certificate Title
    page.drawText('CERTIFICATE OF DISTINCTION & EXCELLENCE', {
      x: 140,
      y: height - 110,
      size: 24,
      font: timesBold,
      color: rgb(0.15, 0.2, 0.3),
    });

    page.drawText('THIS OFFICIAL CERTIFICATE IS PROUDLY PRESENTED TO', {
      x: 230,
      y: height - 165,
      size: 11,
      font: helveticaBold,
      color: rgb(0.5, 0.4, 0.2),
    });

    // Recipient Placeholder Line
    page.drawText('Alexander Montgomery, Ph.D.', {
      x: 245,
      y: height - 235,
      size: 26,
      font: timesBold,
      color: rgb(0.1, 0.15, 0.25),
    });

    page.drawLine({
      start: { x: 180, y: height - 250 },
      end: { x: 612, y: height - 250 },
      thickness: 1,
      color: rgb(0.7, 0.6, 0.35),
    });

    page.drawText('For outstanding achievement in Document Engineering and AI Systems Integration.', {
      x: 160,
      y: height - 290,
      size: 13,
      font: timesItalic,
      color: rgb(0.25, 0.3, 0.38),
    });

    page.drawText('Presented with honor on this 17th day of October, 2026.', {
      x: 245,
      y: height - 325,
      size: 11,
      font: timesRoman,
      color: rgb(0.35, 0.4, 0.45),
    });

    // Signatures
    page.drawLine({
      start: { x: 120, y: 110 },
      end: { x: 300, y: 110 },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });
    page.drawText('Prof. Evelyn Sterling', {
      x: 145,
      y: 92,
      size: 11,
      font: timesBold,
      color: rgb(0.2, 0.25, 0.3),
    });
    page.drawText('Dean of Academic Affairs', {
      x: 142,
      y: 78,
      size: 9.5,
      font: timesRoman,
      color: rgb(0.4, 0.45, 0.5),
    });

    page.drawLine({
      start: { x: 490, y: 110 },
      end: { x: 670, y: 110 },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });
    page.drawText('Dr. Raymond Vance', {
      x: 520,
      y: 92,
      size: 11,
      font: timesBold,
      color: rgb(0.2, 0.25, 0.3),
    });
    page.drawText('Board President', {
      x: 540,
      y: 78,
      size: 9.5,
      font: timesRoman,
      color: rgb(0.4, 0.45, 0.5),
    });

    return {
      bytes: await pdfDoc.save(),
      filename: 'achievement_certificate.pdf',
    };
  } else {
    // Default: Professional Service Invoice (Standard Letter 612 x 792)
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();

    // Top branding banner
    page.drawRectangle({
      x: 0,
      y: height - 110,
      width,
      height: 110,
      color: rgb(0.08, 0.15, 0.27), // Deep Navy
    });

    page.drawText('NOVASOFT CLOUD LABS', {
      x: 50,
      y: height - 52,
      size: 22,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('Enterprise Document Solutions & Cloud Architecture', {
      x: 50,
      y: height - 72,
      size: 10,
      font: helvetica,
      color: rgb(0.7, 0.8, 0.9),
    });

    page.drawText('INVOICE', {
      x: 460,
      y: height - 56,
      size: 26,
      font: helveticaBold,
      color: rgb(0.9, 0.95, 1),
    });

    page.drawText('#INV-2026-0849', {
      x: 460,
      y: height - 76,
      size: 12,
      font: courier,
      color: rgb(0.65, 0.78, 0.92),
    });

    // Metadata section
    let curY = height - 150;
    page.drawText('BILLED TO:', {
      x: 50,
      y: curY,
      size: 10,
      font: helveticaBold,
      color: rgb(0.4, 0.48, 0.58),
    });

    page.drawText('Global Logistics Partners Inc.', {
      x: 50,
      y: curY - 18,
      size: 13,
      font: helveticaBold,
      color: rgb(0.12, 0.16, 0.22),
    });

    page.drawText('Attn: Accounts Payable Department', {
      x: 50,
      y: curY - 34,
      size: 10,
      font: helvetica,
      color: rgb(0.3, 0.35, 0.42),
    });

    page.drawText('742 Silicon Boulevard, Suite 500, Austin, TX 78701', {
      x: 50,
      y: curY - 48,
      size: 9.5,
      font: helvetica,
      color: rgb(0.35, 0.4, 0.48),
    });

    // Invoice details right side
    page.drawText('Invoice Date:', {
      x: 380,
      y: curY,
      size: 10,
      font: helveticaBold,
      color: rgb(0.4, 0.48, 0.58),
    });
    page.drawText('October 17, 2026', {
      x: 470,
      y: curY,
      size: 10,
      font: helvetica,
      color: rgb(0.15, 0.18, 0.24),
    });

    page.drawText('Payment Due:', {
      x: 380,
      y: curY - 18,
      size: 10,
      font: helveticaBold,
      color: rgb(0.4, 0.48, 0.58),
    });
    page.drawText('November 16, 2026 (Net 30)', {
      x: 470,
      y: curY - 18,
      size: 10,
      font: helveticaBold,
      color: rgb(0.8, 0.2, 0.2), // Urgent red tone
    });

    page.drawText('Currency:', {
      x: 380,
      y: curY - 36,
      size: 10,
      font: helveticaBold,
      color: rgb(0.4, 0.48, 0.58),
    });
    page.drawText('USD ($)', {
      x: 470,
      y: curY - 36,
      size: 10,
      font: helvetica,
      color: rgb(0.15, 0.18, 0.24),
    });

    // Table Header
    curY = height - 240;
    page.drawRectangle({
      x: 50,
      y: curY - 10,
      width: 512,
      height: 28,
      color: rgb(0.92, 0.94, 0.98),
    });

    page.drawText('DESCRIPTION / SERVICE', {
      x: 62,
      y: curY,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.35),
    });
    page.drawText('QTY / HRS', {
      x: 340,
      y: curY,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.35),
    });
    page.drawText('RATE', {
      x: 420,
      y: curY,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.35),
    });
    page.drawText('AMOUNT', {
      x: 500,
      y: curY,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.35),
    });

    // Line items
    const items = [
      { desc: 'PDF Font Extraction & Rendering Engine Setup', qty: '40 hrs', rate: '$160.00', amt: '$6,400.00' },
      { desc: 'Smart Nearest-Neighbor Font Consistency Parser', qty: '32 hrs', rate: '$160.00', amt: '$5,120.00' },
      { desc: 'Interactive Canvas Text Layer & Drag Handles', qty: '28 hrs', rate: '$160.00', amt: '$4,480.00' },
      { desc: 'Client-Side PDF-Lib Compilation & Export Module', qty: '15 hrs', rate: '$160.00', amt: '$2,400.00' },
      { desc: 'Multi-device Retina Display DPI Optimization', qty: '8 hrs', rate: '$160.00', amt: '$1,280.00' },
    ];

    curY -= 35;
    for (const item of items) {
      page.drawText(item.desc, {
        x: 62,
        y: curY,
        size: 10,
        font: helvetica,
        color: rgb(0.15, 0.18, 0.24),
      });
      page.drawText(item.qty, {
        x: 345,
        y: curY,
        size: 10,
        font: courier,
        color: rgb(0.3, 0.35, 0.42),
      });
      page.drawText(item.rate, {
        x: 420,
        y: curY,
        size: 10,
        font: courier,
        color: rgb(0.3, 0.35, 0.42),
      });
      page.drawText(item.amt, {
        x: 495,
        y: curY,
        size: 10,
        font: helveticaBold,
        color: rgb(0.12, 0.16, 0.24),
      });

      page.drawLine({
        start: { x: 50, y: curY - 10 },
        end: { x: 562, y: curY - 10 },
        thickness: 0.5,
        color: rgb(0.88, 0.9, 0.93),
      });
      curY -= 28;
    }

    // Totals section
    curY -= 15;
    page.drawText('Subtotal:', {
      x: 380,
      y: curY,
      size: 10.5,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.55),
    });
    page.drawText('$19,680.00', {
      x: 485,
      y: curY,
      size: 10.5,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.3),
    });

    curY -= 20;
    page.drawText('State Sales Tax (0% B2B):', {
      x: 380,
      y: curY,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.55),
    });
    page.drawText('$0.00', {
      x: 520,
      y: curY,
      size: 10,
      font: helvetica,
      color: rgb(0.2, 0.25, 0.3),
    });

    curY -= 22;
    page.drawRectangle({
      x: 370,
      y: curY - 10,
      width: 192,
      height: 32,
      color: rgb(0.08, 0.15, 0.27),
    });

    page.drawText('TOTAL BALANCE DUE:', {
      x: 380,
      y: curY,
      size: 10,
      font: helveticaBold,
      color: rgb(0.9, 0.95, 1),
    });
    page.drawText('$19,680.00', {
      x: 495,
      y: curY,
      size: 12,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    // Notes
    curY = 90;
    page.drawText('Payment Instructions:', {
      x: 50,
      y: curY,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.3, 0.35, 0.45),
    });
    page.drawText('Wire Transfer ACH to First National Reserve Bank, Routing: 021000089, Account: 9028-114-88', {
      x: 50,
      y: curY - 15,
      size: 9,
      font: courier,
      color: rgb(0.4, 0.45, 0.5),
    });
    page.drawText('Thank you for partnering with NovaSoft Cloud Labs. For inquiries, email billing@novasoft.example.com', {
      x: 50,
      y: curY - 30,
      size: 8.5,
      font: helvetica,
      color: rgb(0.5, 0.55, 0.6),
    });

    return {
      bytes: await pdfDoc.save(),
      filename: 'novasoft_invoice_INV2026.pdf',
    };
  }
}
