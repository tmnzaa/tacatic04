const fs = require("fs");

const metadata = {
  "sticker-pack-id": "tamstore.id",
  "sticker-pack-name": "Tam Store Sticker",
  "sticker-pack-publisher": "Tamianza",
  emojis: ["🔥"]
};

const jsonStr = JSON.stringify(metadata);
const exifAttr = Buffer.concat([
  Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]), // TIFF header
  Buffer.from(jsonStr)
]);

fs.writeFileSync("metadata.exif", exifAttr);

console.log("✅ metadata.exif berhasil dibuat!");
