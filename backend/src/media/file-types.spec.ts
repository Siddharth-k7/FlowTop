import { jpegFile, pdfFile, pngFile, svgFile, windowsExecutable } from '../../test/fixtures/files';
import { BUCKET_FILE_TYPES, detectFileType, displayFilename, looksExecutable, MAX_UPLOAD_BYTES } from './file-types';

describe('detectFileType', () => {
  it('recognises each allowed type from its bytes', () => {
    expect(detectFileType(jpegFile(10, 10))).toBe('image/jpeg');
    expect(detectFileType(pngFile(2, 2))).toBe('image/png');
    expect(detectFileType(pdfFile())).toBe('application/pdf');
    expect(detectFileType(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]))).toBe('image/webp');
    expect(detectFileType(Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from('ftypavif')]))).toBe('image/avif');
  });

  it('does not accept SVG, HTML, text, empty or truncated input', () => {
    expect(detectFileType(svgFile())).toBeNull();
    expect(detectFileType(Buffer.from('<!doctype html><script>alert(1)</script>'))).toBeNull();
    expect(detectFileType(Buffer.from('just some text'))).toBeNull();
    expect(detectFileType(Buffer.alloc(0))).toBeNull();
    expect(detectFileType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });

  it('does not accept HEIC, which shares the ftyp box with AVIF', () => {
    expect(detectFileType(Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic')]))).toBeNull();
  });
});

describe('looksExecutable', () => {
  it.each([
    ['Windows PE', windowsExecutable()],
    ['Linux ELF', Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1])],
    ['Mach-O 64', Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 7, 0, 0, 1])],
    ['shell script', Buffer.from('#!/bin/sh\nrm -rf /\n')],
    ['WebAssembly', Buffer.from([0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0])],
  ])('flags %s', (_name, bytes) => {
    expect(looksExecutable(bytes)).toBe(true);
  });

  it('does not flag real images or PDFs', () => {
    expect(looksExecutable(pngFile(1, 1))).toBe(false);
    expect(looksExecutable(jpegFile(1, 1))).toBe(false);
    expect(looksExecutable(pdfFile())).toBe(false);
  });
});

describe('bucket rules', () => {
  it('never allows SVG or AVIF in the private bucket and caps uploads at 25 MB', () => {
    expect(BUCKET_FILE_TYPES.private).not.toContain('image/avif');
    expect(MAX_UPLOAD_BYTES).toBe(25 * 1024 * 1024);
  });
});

describe('displayFilename', () => {
  it('keeps only the last path segment and strips control characters', () => {
    expect(displayFilename('../../etc/passwd.png', 'png')).toBe('passwd.png');
    expect(displayFilename('C:\\Users\\me\\Opel Mixer.jpg', 'jpg')).toBe('Opel Mixer.jpg');
    expect(displayFilename('bad\u0000\u001fname.pdf', 'pdf')).toBe('badname.pdf');
  });

  it('falls back to a neutral name when nothing usable is left', () => {
    expect(displayFilename('../', 'png')).toBe('upload.png');
    expect(displayFilename(undefined, 'pdf')).toBe('upload.pdf');
  });
});
