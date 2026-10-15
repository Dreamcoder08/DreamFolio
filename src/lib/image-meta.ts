/** Reads an image's real type and pixel size from its header bytes, so
 *  og:image:type/width/height describe the file itself rather than its
 *  extension (fiscal-workspace.jpg is actually a PNG). Pure: callers pass
 *  the bytes. Returns null for anything it does not recognise. */
export interface ImageMeta {
  type: "image/png" | "image/jpeg" | "image/webp";
  width: number;
  height: number;
}

export function sniffImage(bytes: Uint8Array): ImageMeta | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));

  if (bytes.length >= 24 && ascii(1, 3) === "PNG") {
    return {
      type: "image/png",
      width: view.getUint32(16),
      height: view.getUint32(20),
    };
  }

  if (bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8 ") {
      return {
        type: "image/webp",
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }
    if (chunk === "VP8L") {
      const bits = view.getUint32(21, true);
      return {
        type: "image/webp",
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    if (chunk === "VP8X") {
      const read24 = (at: number) =>
        bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
      return {
        type: "image/webp",
        width: read24(24) + 1,
        height: read24(27) + 1,
      };
    }
    return null;
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return null;
      const marker = bytes[offset + 1];
      const length = view.getUint16(offset + 2);
      // SOF0–SOF15 carry the frame size, except DHT (C4), JPG (C8), DAC (CC).
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      ) {
        return {
          type: "image/jpeg",
          height: view.getUint16(offset + 5),
          width: view.getUint16(offset + 7),
        };
      }
      offset += 2 + length;
    }
  }
  return null;
}
