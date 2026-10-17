import test from 'node:test';
import assert from 'node:assert/strict';
import {
  screenToPdfCoordinates,
  pdfToScreenCoordinates,
  convertFontSizeToPdf,
  convertPdfToScreenFontSize,
  hexToRgb,
} from './coordinateTransform.ts';
import type { PageDimensionInfo } from './coordinateTransform.ts';

const mockDimensions: PageDimensionInfo = {
  pdfPageWidth: 600,
  pdfPageHeight: 800,
  viewWidth: 600,
  viewHeight: 800,
};

test('screenToPdfCoordinates inverts Y correctly for bottom-left origin', () => {
  // Top-left screen box: x=0, y=0, w=100, h=50
  // In PDF, bottom should be 800 - (0 + 50) = 750
  const pdfCoords = screenToPdfCoordinates(
    { x: 0, y: 0, width: 100, height: 50 },
    mockDimensions
  );

  assert.equal(pdfCoords.x, 0);
  assert.equal(pdfCoords.y, 750);
  assert.equal(pdfCoords.width, 100);
  assert.equal(pdfCoords.height, 50);

  // Bottom-left screen box: x=0, y=750, w=100, h=50
  // In PDF, bottom should be 800 - 800 = 0
  const bottomCoords = screenToPdfCoordinates(
    { x: 0, y: 750, width: 100, height: 50 },
    mockDimensions
  );
  assert.equal(bottomCoords.y, 0);
});

test('round-trip coordinate conversion maintains exact positioning', () => {
  const scaledDimensions: PageDimensionInfo = {
    pdfPageWidth: 595.28,
    pdfPageHeight: 841.89,
    viewWidth: 800,
    viewHeight: 1131.24,
  };

  const originalScreen = { x: 120, y: 340, width: 250, height: 40 };
  const pdfBox = screenToPdfCoordinates(originalScreen, scaledDimensions);
  const backToScreen = pdfToScreenCoordinates(pdfBox, scaledDimensions);

  assert.ok(Math.abs(backToScreen.x - originalScreen.x) < 0.1);
  assert.ok(Math.abs(backToScreen.y - originalScreen.y) < 0.1);
  assert.ok(Math.abs(backToScreen.width - originalScreen.width) < 0.1);
  assert.ok(Math.abs(backToScreen.height - originalScreen.height) < 0.1);
});

test('font size conversion scales proportionally with page height', () => {
  const pdfFontSize = convertFontSizeToPdf(16, 800, 800);
  assert.equal(pdfFontSize, 16);

  const scaledPdfFontSize = convertFontSizeToPdf(32, 1600, 800);
  assert.equal(scaledPdfFontSize, 16);

  const screenFontSize = convertPdfToScreenFontSize(16, 1600, 800);
  assert.equal(screenFontSize, 32);
});

test('hexToRgb parses standard colors and shorthand properly', () => {
  assert.deepEqual(hexToRgb('#000000'), { r: 0, g: 0, b: 0 });
  assert.deepEqual(hexToRgb('#ffffff'), { r: 1, g: 1, b: 1 });
  assert.deepEqual(hexToRgb('#fff'), { r: 1, g: 1, b: 1 });
  const red = hexToRgb('#ff0000');
  assert.equal(red.r, 1);
  assert.equal(red.g, 0);
  assert.equal(red.b, 0);
});
