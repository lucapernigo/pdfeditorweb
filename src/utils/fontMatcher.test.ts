import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePdfFontName, findNearestTextBlock, distanceToBox } from './fontMatcher.ts';
import type { ExtractedTextItem } from '../types/pdf.ts';

test('parsePdfFontName detects Helvetica standard fonts and styles', () => {
  const parsed1 = parsePdfFontName('BCDFEE+Helvetica-Bold');
  assert.equal(parsed1.fontFamily, 'Helvetica');
  assert.equal(parsed1.fontWeight, 'bold');
  assert.equal(parsed1.fontStyle, 'normal');

  const parsed2 = parsePdfFontName('Helvetica-Oblique');
  assert.equal(parsed2.fontFamily, 'Helvetica');
  assert.equal(parsed2.fontWeight, 'normal');
  assert.equal(parsed2.fontStyle, 'italic');

  const parsed3 = parsePdfFontName('Helvetica-BoldItalic');
  assert.equal(parsed3.fontFamily, 'Helvetica');
  assert.equal(parsed3.fontWeight, 'bold');
  assert.equal(parsed3.fontStyle, 'italic');
});

test('parsePdfFontName detects Times, Courier, and Arial fonts', () => {
  const times = parsePdfFontName('TimesNewRomanPS-BoldMT');
  assert.equal(times.fontFamily, 'Times New Roman');
  assert.equal(times.fontWeight, 'bold');

  const courier = parsePdfFontName('CourierNewPSMT');
  assert.equal(courier.fontFamily, 'Courier');
  assert.equal(courier.fontWeight, 'normal');

  const arial = parsePdfFontName('Arial-Bold');
  assert.equal(arial.fontFamily, 'Arial');
  assert.equal(arial.fontWeight, 'bold');
});

test('distanceToBox computes exact distances to rectangles', () => {
  // Point inside the box
  assert.equal(distanceToBox(50, 50, 0, 0, 100, 100), 0);
  // Point 20px above the box
  assert.equal(distanceToBox(50, -20, 0, 0, 100, 100), 20);
  // Point 30px to the right of the box
  assert.equal(distanceToBox(130, 50, 0, 0, 100, 100), 30);
  // Diagonal distance: 3, 4, 5 triangle
  assert.equal(distanceToBox(103, 104, 0, 0, 100, 100), 5);
});

test('findNearestTextBlock finds closest neighborhood style with confidence', () => {
  const sampleItems: ExtractedTextItem[] = [
    {
      id: 'item-1',
      text: 'INVOICE SUMMARY',
      originalText: 'INVOICE SUMMARY',
      x: 50,
      y: 50,
      width: 150,
      height: 24,
      rawFontName: 'Helvetica-Bold',
      fontFamily: 'Helvetica',
      fontSize: 24,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#1e293b',
      letterSpacing: 0,
      pageNumber: 1,
    },
    {
      id: 'item-2',
      text: 'Invoice Date: October 17, 2026',
      originalText: 'Invoice Date: October 17, 2026',
      x: 50,
      y: 100,
      width: 200,
      height: 14,
      rawFontName: 'TimesNewRomanPSMT',
      fontFamily: 'Times New Roman',
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#475569',
      letterSpacing: 0,
      pageNumber: 1,
    },
  ];

  // Click right below "INVOICE SUMMARY" at (60, 78)
  const matched1 = findNearestTextBlock(60, 78, sampleItems, 300);
  assert.ok(matched1);
  assert.equal(matched1.fontFamily, 'Helvetica');
  assert.equal(matched1.fontWeight, 'bold');
  assert.equal(matched1.sourceText, 'INVOICE SUMMARY');
  assert.ok(matched1.confidence > 0.8);

  // Click right next to "Invoice Date" at (260, 105)
  const matched2 = findNearestTextBlock(260, 105, sampleItems, 300);
  assert.ok(matched2);
  assert.equal(matched2.fontFamily, 'Times New Roman');
  assert.equal(matched2.fontWeight, 'normal');
  assert.equal(matched2.sourceText, 'Invoice Date: October 17, 2026');

  // Click far away beyond threshold
  const matchedFar = findNearestTextBlock(800, 800, sampleItems, 100);
  assert.equal(matchedFar, null);
});
