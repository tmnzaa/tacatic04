const fs = require('fs-extra');
const { exec } = require('child_process');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const Jimp = require('jimp');

module.exports = async (sock, msg, text, from) => {
  if (text === '.menu') {
    return sock.sendMessage(from, {
      text: `🎀 *MENU BOT UNTUK SEMUA MEMBER* 🎀

📌 Kamu bisa pakai fitur ini:
• 📋 .menu
• 🖼️ .stiker (kirim gambar, lalu ketik)
• 💬 .addbrat teks

Contoh:
– .addbrat Selamat ulang tahun
– Kirim gambar lalu ketik .stiker

Semoga harimu menyenangkan! ✨`
    }, { quoted: msg });
  }

  // .stiker
  if (text === '.stiker') {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const mediaMessage = quoted?.imageMessage || msg?.message?.imageMessage;
    if (!mediaMessage) {
      return sock.sendMessage(from, { text: '❌ Kirim atau reply gambar dengan .stiker' }, { quoted: msg });
    }

    try {
      const buffer = await downloadMediaMessage(
        { message: quoted ? { imageMessage: quoted.imageMessage } : msg.message },
        'buffer',
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      );

      const filename = `./${Date.now()}`;
      const inputPath = `${filename}.jpg`;
      const outputPath = `${filename}.webp`;

      fs.writeFileSync(inputPath, buffer);

      await new Promise((resolve, reject) => {
        const cmd = `convert "${inputPath}" -resize 512x512^ -gravity center -extent 512x512 -quality 100 "${outputPath}"`;
        exec(cmd, (err) => err ? reject(err) : resolve());
      });

      const stickerBuffer = fs.readFileSync(outputPath);
      await sock.sendMessage(from, { sticker: stickerBuffer, mimetype: 'image/webp' }, { quoted: msg });

      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    } catch (err) {
      console.error(err);
      await sock.sendMessage(from, { text: '⚠️ Gagal membuat stiker!' }, { quoted: msg });
    }
  }

  // .addbrat
  if (text.startsWith('.addbrat ')) {
    const teks = text.split('.addbrat ')[1].trim();
    if (!teks) {
      return sock.sendMessage(from, {
        text: '❌ Masukkan teks setelah .addbrat\nContoh: .addbrat semangat terus ya!'
      }, { quoted: msg });
    }

    try {
      const filename = Date.now();
      const pngPath = `./${filename}.png`;
      const webpPath = `./${filename}.webp`;

      const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
      const image = new Jimp(512, 512, 0xffffffff);
      const lines = teks.split(' ').reduce((a, b, i) => {
        if (i % 2 === 0) a.push(b);
        else a[a.length - 1] += ' ' + b;
        return a;
      }, []).join('\n');

      image.print(font, 0, 0, {
        text: lines,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      }, 512, 512);

      image.quality(100);
      await image.writeAsync(pngPath);

      await new Promise((resolve, reject) => {
        const cmd = `convert "${pngPath}" -resize 512x512^ -gravity center -extent 512x512 -quality 100 "${webpPath}"`;
        exec(cmd, (err) => err ? reject(err) : resolve());
      });

      const buffer = fs.readFileSync(webpPath);
      await sock.sendMessage(from, { sticker: buffer, mimetype: 'image/webp' }, { quoted: msg });

      fs.unlinkSync(pngPath);
      fs.unlinkSync(webpPath);
    } catch (err) {
      console.error(err);
      await sock.sendMessage(from, { text: '⚠️ Gagal membuat stiker teks!' }, { quoted: msg });
    }
  }
};
