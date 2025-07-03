const fs = require("fs");

function addAuthorMetadata(buffer, author = "Tacatic 04") {
  const json = {
    "sticker-pack-id": "tacatic04",
    "sticker-pack-name": "Sticker",
    "sticker-pack-publisher": author
  };

  const jsonStr = JSON.stringify(json);
  const exif = Buffer.concat([
    Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]),
    Buffer.from(jsonStr)
  ]);

  const body = buffer.slice(12); // hilangkan header asli
  const final = Buffer.concat([
    Buffer.from("RIFF"),
    buffer.slice(4, 8),
    Buffer.from("WEBP"),
    body,
    Buffer.from("EXIF"),
    exif
  ]);

  return final;
}

module.exports = { addAuthorMetadata };
