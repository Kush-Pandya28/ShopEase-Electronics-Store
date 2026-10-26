import PDFDocument from 'pdfkit';
import { GST_RATE, round2 } from '../utils/pricing.js';

const SELLER = {
  name: 'ShopEase Retail Pvt. Ltd.',
  address: '4th Floor, Tech Park, SG Highway, Ahmedabad, Gujarat - 380054',
  gstin: '24ABCDE1234F1Z5',
  email: 'support@shopease.com',
};

// PDFKit's built-in fonts have no Rupee glyph, so use "Rs."
const rs = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

/** Streams a GST tax invoice for the order into the writable stream (e.g. an Express response). */
export const generateInvoice = (order, stream) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(stream);

  // Header
  doc.fillColor('#4f46e5').fontSize(22).font('Helvetica-Bold').text('ShopEase', 40, 40);
  doc.fillColor('#111').fontSize(14).text('TAX INVOICE', 400, 45, { align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor('#444');
  doc.text(SELLER.name, 40, 70).text(SELLER.address).text(`GSTIN: ${SELLER.gstin}`).text(SELLER.email);

  doc.text(`Invoice No: ${order.invoiceNumber}`, 350, 70, { align: 'right' });
  doc.text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.text(`Order ID: ${order._id}`, { align: 'right' });
  doc.text(`Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}${order.isPaid ? ' (Paid)' : ''}`, {
    align: 'right',
  });

  // Addresses
  const a = order.shippingAddress || {};
  doc.moveTo(40, 140).lineTo(555, 140).strokeColor('#ddd').stroke();
  doc.font('Helvetica-Bold').fillColor('#111').fontSize(10).text('Bill / Ship To:', 40, 150);
  doc.font('Helvetica').fontSize(9).fillColor('#333');
  doc.text(a.fullName || '', 40, 165);
  doc.text([a.street, a.landmark].filter(Boolean).join(', '));
  doc.text(`${a.city}, ${a.state} - ${a.pincode}`);
  doc.text(`Phone: ${a.phone}`);
  doc.text(`Place of supply: ${a.state}`, 350, 165, { align: 'right' });

  // Items table
  const cols = [40, 250, 290, 355, 425, 490];
  const headers = ['Item', 'Qty', 'Rate', 'Taxable', 'GST 18%', 'Total'];
  let y = 235;
  doc.rect(40, y - 5, 515, 20).fill('#eef2ff');
  doc.fillColor('#111').font('Helvetica-Bold').fontSize(9);
  headers.forEach((h, i) => doc.text(h, cols[i], y, { width: i === 0 ? 200 : 60, align: i === 0 ? 'left' : 'right' }));
  y += 22;
  doc.font('Helvetica').fontSize(8.5);

  order.items.forEach((item) => {
    const lineTotal = item.price * item.quantity;
    const taxable = round2(lineTotal / (1 + GST_RATE));
    const gst = round2(lineTotal - taxable);
    const desc = [item.title, item.variantLabel, item.serialNumber && `S/N: ${item.serialNumber}`]
      .filter(Boolean)
      .join('\n');
    const rowHeight = Math.max(doc.heightOfString(desc, { width: 200 }), 12) + 8;
    if (y + rowHeight > 720) {
      doc.addPage();
      y = 50;
    }
    doc.fillColor('#222').text(desc, cols[0], y, { width: 200 });
    doc.text(String(item.quantity), cols[1], y, { width: 30, align: 'right' });
    [rs(item.price), rs(taxable), rs(gst), rs(lineTotal)].forEach((v, i) =>
      doc.text(v, cols[i + 2], y, { width: 60, align: 'right' })
    );
    y += rowHeight;
    doc.moveTo(40, y - 4).lineTo(555, y - 4).strokeColor('#eee').stroke();
  });

  // Totals with CGST / SGST bifurcation
  const cgst = round2(order.taxPrice / 2);
  const sgst = round2(order.taxPrice - cgst);
  const rows = [
    ['Items total', rs(order.itemsPrice)],
    ...(order.discount ? [[`Discount${order.coupon ? ` (${order.coupon})` : ''}`, `- ${rs(order.discount)}`]] : []),
    ['Taxable value', rs(order.itemsPrice - order.discount - order.taxPrice)],
    ['CGST @ 9%', rs(cgst)],
    ['SGST @ 9%', rs(sgst)],
    ['Shipping', order.shippingPrice ? rs(order.shippingPrice) : 'FREE'],
  ];
  y += 10;
  doc.fontSize(9);
  rows.forEach(([label, value]) => {
    doc.fillColor('#444').text(label, 330, y, { width: 140 });
    doc.text(value, 470, y, { width: 85, align: 'right' });
    y += 15;
  });
  doc.rect(330, y, 225, 22).fill('#4f46e5');
  doc.fillColor('#fff').font('Helvetica-Bold').text('Grand Total', 338, y + 6);
  doc.text(rs(order.totalPrice), 470, y + 6, { width: 78, align: 'right' });

  doc.font('Helvetica').fillColor('#777').fontSize(8);
  doc.text(
    'This is a computer generated invoice and does not require a signature. Products carry brand warranty as per the manufacturer terms. 7 day replacement policy applicable.',
    40,
    770,
    { width: 515, align: 'center' }
  );

  doc.end();
};
