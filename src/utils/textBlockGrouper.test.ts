import test from 'node:test';
import assert from 'node:assert/strict';
import { groupAdjacentTextItems } from './textBlockGrouper.ts';
import type { ExtractedTextItem } from '../types/pdf.ts';

test('groupAdjacentTextItems merges adjacent words on same line', () => {
  const fragments: ExtractedTextItem[] = [
    {
      id: 'item-1',
      text: 'Global',
      originalText: 'Global',
      x: 50,
      y: 100,
      width: 40,
      height: 14,
      rawFontName: 'Helvetica',
      fontFamily: 'Helvetica',
      fontSize: 14,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#1e293b',
      letterSpacing: 0,
      pageNumber: 1,
    },
    {
      id: 'item-2',
      text: 'Logistics',
      originalText: 'Logistics',
      x: 95,
      y: 100,
      width: 55,
      height: 14,
      rawFontName: 'Helvetica',
      fontFamily: 'Helvetica',
      fontSize: 14,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#1e293b',
      letterSpacing: 0,
      pageNumber: 1,
    },
    {
      id: 'item-3',
      text: 'Partners',
      originalText: 'Partners',
      x: 155,
      y: 100,
      width: 50,
      height: 14,
      rawFontName: 'Helvetica',
      fontFamily: 'Helvetica',
      fontSize: 14,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#1e293b',
      letterSpacing: 0,
      pageNumber: 1,
    },
  ];

  const grouped = groupAdjacentTextItems(fragments);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].text, 'Global Logistics Partners');
  assert.equal(grouped[0].x, 50);
  assert.ok(grouped[0].width >= 155);
});

test('groupAdjacentTextItems does not merge items on separate lines or across large gaps', () => {
  const fragments: ExtractedTextItem[] = [
    {
      id: 'item-1',
      text: 'DESCRIPTION',
      originalText: 'DESCRIPTION',
      x: 50,
      y: 100,
      width: 80,
      height: 12,
      rawFontName: 'Helvetica',
      fontFamily: 'Helvetica',
      fontSize: 12,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#1e293b',
      letterSpacing: 0,
      pageNumber: 1,
    },
    {
      id: 'item-2',
      text: 'AMOUNT',
      originalText: 'AMOUNT',
      x: 400, // Large gap (separate column)
      y: 100,
      width: 50,
      height: 12,
      rawFontName: 'Helvetica',
      fontFamily: 'Helvetica',
      fontSize: 12,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#1e293b',
      letterSpacing: 0,
      pageNumber: 1,
    },
    {
      id: 'item-3',
      text: 'Subtotal Row',
      originalText: 'Subtotal Row',
      x: 50,
      y: 150, // Different line
      width: 80,
      height: 12,
      rawFontName: 'Helvetica',
      fontFamily: 'Helvetica',
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#1e293b',
      letterSpacing: 0,
      pageNumber: 1,
    },
  ];

  const grouped = groupAdjacentTextItems(fragments);
  assert.equal(grouped.length, 3);
});
