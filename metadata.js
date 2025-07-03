// genExif.js
const fs = require('fs');

const exifAttr = {
  "sticker-pack-id": "tacatic04",
  "sticker-pack-name": "Tam Store",
  "sticker-pack-publisher": "Tamianza"
};

const json = JSON.stringify(exifAttr);
const exifCode = Buffer.concat([
  Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]),
  Buffer.from(json)
]);

fs.writeFileSync('metadata.exif', exifCode);
console.log('✅ metadata.exif berhasil dibuat');
