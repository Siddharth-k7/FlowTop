import { MediaBucket } from '../generated/prisma/client';

/**
 * What can be uploaded, decided by the file's own first bytes (its magic
 * number). The extension and the browser-sent Content-Type are ignored: both
 * are chosen by whoever uploads the file.
 */

const MB = 1024 * 1024;

export type FileKind = 'image' | 'document';

export interface AllowedFileType {
  mimeType: string;
  /** Extension used in the storage key. Never taken from the uploaded filename. */
  extension: string;
  kind: FileKind;
  maxBytes: number;
  label: string;
}

export const ALLOWED_FILE_TYPES = {
  'image/jpeg': { mimeType: 'image/jpeg', extension: 'jpg', kind: 'image', maxBytes: 15 * MB, label: 'JPEG' },
  'image/png': { mimeType: 'image/png', extension: 'png', kind: 'image', maxBytes: 15 * MB, label: 'PNG' },
  'image/webp': { mimeType: 'image/webp', extension: 'webp', kind: 'image', maxBytes: 15 * MB, label: 'WebP' },
  'image/avif': { mimeType: 'image/avif', extension: 'avif', kind: 'image', maxBytes: 15 * MB, label: 'AVIF' },
  'application/pdf': { mimeType: 'application/pdf', extension: 'pdf', kind: 'document', maxBytes: 25 * MB, label: 'PDF' },
} as const satisfies Record<string, AllowedFileType>;

export type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES;

/**
 * Public: product photos, marketing images and downloadable manuals.
 * Private: customer documents. No SVG or HTML anywhere: both can carry script.
 */
export const BUCKET_FILE_TYPES: Record<MediaBucket, readonly AllowedMimeType[]> = {
  public: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'],
  private: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

/** The multipart limit. Larger uploads are cut off while streaming, before any check runs. */
export const MAX_UPLOAD_BYTES = Math.max(...Object.values(ALLOWED_FILE_TYPES).map((type) => type.maxBytes));

/** The file's real type from its first bytes, or null if it is not one we accept. */
export function detectFileType(bytes: Buffer): AllowedMimeType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'image/webp';
  if (ascii(bytes, 4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(bytes, 8, 12))) return 'image/avif';
  if (ascii(bytes, 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

/**
 * Programs and scripts, whatever they are named. Checked before the allow list
 * so the rejection says why, and so these attempts can be logged.
 */
export function looksExecutable(bytes: Buffer): boolean {
  return (
    ascii(bytes, 0, 2) === 'MZ' || // Windows .exe, .dll, .scr
    startsWith(bytes, [0x7f, 0x45, 0x4c, 0x46]) || // Linux ELF
    startsWith(bytes, [0xfe, 0xed, 0xfa, 0xce]) || // Mach-O 32-bit
    startsWith(bytes, [0xfe, 0xed, 0xfa, 0xcf]) || // Mach-O 64-bit
    startsWith(bytes, [0xce, 0xfa, 0xed, 0xfe]) || // Mach-O 32-bit, little endian
    startsWith(bytes, [0xcf, 0xfa, 0xed, 0xfe]) || // Mach-O 64-bit, little endian
    startsWith(bytes, [0xca, 0xfe, 0xba, 0xbe]) || // Mach-O universal, Java class
    startsWith(bytes, [0x00, 0x61, 0x73, 0x6d]) || // WebAssembly
    ascii(bytes, 0, 2) === '#!' // shell and other scripts
  );
}

/**
 * The uploaded filename, kept for display only. Path segments and control
 * characters are stripped; it is never used to build a storage path.
 */
export function displayFilename(original: string | undefined, extension: string): string {
  const lastSegment = (original ?? '').split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  const cleaned = lastSegment.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 255);
  return cleaned || `upload.${extension}`;
}

function startsWith(bytes: Buffer, signature: number[]): boolean {
  return bytes.length >= signature.length && signature.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Buffer, start: number, end: number): string {
  return bytes.length >= end ? bytes.toString('latin1', start, end) : '';
}
