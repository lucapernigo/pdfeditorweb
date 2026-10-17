import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSamplePdf } from './sampleDocuments.ts';

test('generateSamplePdf generates valid PDF bytes for invoice, contract, certificate', async () => {
  const invoice = await generateSamplePdf('invoice');
  assert.ok(invoice.bytes.length > 500);
  assert.equal(invoice.filename, 'novasoft_invoice_INV2026.pdf');

  const contract = await generateSamplePdf('contract');
  assert.ok(contract.bytes.length > 500);
  assert.equal(contract.filename, 'consulting_agreement.pdf');

  const cert = await generateSamplePdf('certificate');
  assert.ok(cert.bytes.length > 500);
  assert.equal(cert.filename, 'achievement_certificate.pdf');
});
