const fs = require('fs');

const metadata = {
  "sticker-pack-id": "tacatic04",
  "sticker-pack-name": "Tam Store",
  "sticker-pack-publisher": "Tamianza"
};

const json = JSON.stringify(metadata);
const exifAttr = Buffer.concat([
  Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]),
  Buffer.from(json)
]);

const exif = Buffer.concat([
  Buffer.from('Exif\x00\x00'),
  exifAttr
]);

fs.writeFileSync('metadata.exif', exif);
console.log('✅ metadata.exif berhasil dibuat!');
