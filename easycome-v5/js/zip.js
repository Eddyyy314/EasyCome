(function (global) {
  'use strict';

  const encoder = new TextEncoder();

  function makeCrcTable() {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    return table;
  }

  const crcTable = makeCrcTable();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
      crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function u16(value) {
    const out = new Uint8Array(2);
    new DataView(out.buffer).setUint16(0, value, true);
    return out;
  }

  function u32(value) {
    const out = new Uint8Array(4);
    new DataView(out.buffer).setUint32(0, value >>> 0, true);
    return out;
  }

  function concat(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    parts.forEach((part) => {
      out.set(part, offset);
      offset += part.length;
    });
    return out;
  }

  function dosDateTime(date) {
    const d = date || new Date();
    const year = Math.max(1980, d.getFullYear());
    const dosTime = ((d.getHours() & 0x1f) << 11)
      | ((d.getMinutes() & 0x3f) << 5)
      | ((Math.floor(d.getSeconds() / 2)) & 0x1f);
    const dosDate = (((year - 1980) & 0x7f) << 9)
      | (((d.getMonth() + 1) & 0x0f) << 5)
      | (d.getDate() & 0x1f);
    return { dosTime, dosDate };
  }

  function normalizeFile(file) {
    const name = String(file.name || '').replace(/^\/+/, '').replace(/\\/g, '/');
    if (!name) throw new Error('Ogni file ZIP deve avere un nome.');
    let data;
    if (file.data instanceof Uint8Array) data = file.data;
    else if (file.data instanceof ArrayBuffer) data = new Uint8Array(file.data);
    else data = encoder.encode(String(file.data ?? ''));
    return { name, data, date: file.date || new Date() };
  }

  function createZipBytes(files) {
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;

    files.map(normalizeFile).forEach((file) => {
      const nameBytes = encoder.encode(file.name);
      const { dosTime, dosDate } = dosDateTime(file.date);
      const crc = crc32(file.data);

      const localHeader = concat([
        u32(0x04034b50),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(dosTime),
        u16(dosDate),
        u32(crc),
        u32(file.data.length),
        u32(file.data.length),
        u16(nameBytes.length),
        u16(0),
        nameBytes,
      ]);

      localParts.push(localHeader, file.data);

      const centralHeader = concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(dosTime),
        u16(dosDate),
        u32(crc),
        u32(file.data.length),
        u32(file.data.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(localOffset),
        nameBytes,
      ]);

      centralParts.push(centralHeader);
      localOffset += localHeader.length + file.data.length;
    });

    const centralDirectory = concat(centralParts);
    const localData = concat(localParts);
    const end = concat([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralDirectory.length),
      u32(localData.length),
      u16(0),
    ]);

    return concat([localData, centralDirectory, end]);
  }

  function createZip(files) {
    return new Blob([createZipBytes(files)], { type: 'application/zip' });
  }

  global.EasyZip = { createZip, createZipBytes, crc32 };
}(window));
