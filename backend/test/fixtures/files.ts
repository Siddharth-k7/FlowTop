import { crc32, deflateSync } from 'node:zlib';

/**
 * Test files built in code, so no binary blobs live in the repo. Each one is
 * genuinely what it claims to be at the byte level, which is all the upload
 * checks look at.
 */

/** A real, decodable RGB PNG of the given size. */
export function pngFile(width: number, height: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit, RGB, deflate, no filter, no interlace
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0x80)]);
  const pixels = deflateSync(Buffer.concat(Array.from({ length: height }, () => row)));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', pixels),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** A JPEG header with its dimensions in the SOF0 frame, padded to `totalBytes` if given. */
export function jpegFile(width: number, height: number, totalBytes = 0): Buffer {
  const jfif = Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]);
  const body = Buffer.concat([Buffer.from([0xff, 0xd8]), jfif, sof]);
  const end = Buffer.from([0xff, 0xd9]);
  const padding = Math.max(0, totalBytes - body.length - end.length);
  return Buffer.concat([body, Buffer.alloc(padding), end]);
}

export function pdfFile(): Buffer {
  return Buffer.from('%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
}

/** The start of a Windows executable: the MZ header and its DOS stub message. */
export function windowsExecutable(): Buffer {
  const stub = Buffer.alloc(128);
  stub.write('MZ', 0, 'latin1');
  stub.write('This program cannot be run in DOS mode.', 64, 'latin1');
  return stub;
}

export function svgFile(): Buffer {
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>');
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, checksum]);
}
