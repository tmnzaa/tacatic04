// exif.js
const makeExif = (packname = 'Tacatic Pack', author = 'aditttt') => {
  const code = [
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x1C, 0x01, 0x07, 0x00
  ];

  const json = {
    'sticker-pack-id': 'com.tacatic.sticker',
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    'android-app-store-link': '',
    'ios-app-store-link': ''
  };

  const len = JSON.stringify(json).length;

  return Buffer.concat([
    Buffer.from([...code, len, 0x00, 0x00, 0x00, 0x1A, 0x00, 0x00, 0x00]),
    Buffer.from(JSON.stringify(json), 'utf-8')
  ]);
};

module.exports = makeExif;
