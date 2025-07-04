const fs = require('fs-extra');
const { exec } = require('child_process');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const Jimp = require('jimp');
const axios = require('axios'); // ← Tambah ini
const removebgApiKey = 'Bbu9ZjZcsJAnpif94ma6sqZN'; // ← API Key kamu

module.exports = async (sock, msg, text, from) => {
  const db = fs.readJsonSync('./grup.json');
  const fitur = db[from] || {};

  const now = new Date();
  const isAktif = fitur.permanen || (fitur.expired && new Date(fitur.expired) > now);

  // Allow .menu even if bot is not active
  if (!isAktif && !text.startsWith('.menu')) {
    return sock.sendMessage(from, {
      text: `⚠️ Bot belum aktif di grup ini.\n\nMinta *Owner Grup* aktifkan dulu dengan:\n• .aktifbot3k (1 minggu)\n• .aktifbot5k (1 bulan)\n• .aktifbot7k (2 bulan)\n• .aktifbotper (permanen)`
    }, { quoted: msg });
  }

  if (text === '.menu') {
  return sock.sendMessage(from, {
    text: `🎀 *MENU BOT UNTUK SEMUA MEMBER* 🎀

📌 Kamu bisa pakai fitur ini:
• 📋 .menu
• 🖼️ .stiker (kirim gambar, lalu ketik)
• 🖼️ .hd (ubah gambar jadi lebih tajam)
• 🖼️ .removebg (hapus bakground)
• 💬 .addbrat teks

Contoh:
– .addbrat Selamat ulang tahun
– Kirim gambar lalu ketik .stiker
– Reply gambar lalu ketik .hd

✨ Nikmati fitur seru dari *Tacatic Bot 04*!`
  }, { quoted: msg });
}

 if (text === '.hd') {
  const context = msg.message?.extendedTextMessage?.contextInfo;
  const quotedMsg = context?.quotedMessage;

  if (!quotedMsg || !quotedMsg.imageMessage) {
    return sock.sendMessage(from, {
      text: '❌ Reply gambar lalu ketik *.hd* untuk membuat versi HD-nya.'
    }, { quoted: msg });
  }

  try {
    const buffer = await downloadMediaMessage(
      { message: { imageMessage: quotedMsg.imageMessage } },
      'buffer',
      {},
      { logger: console, reuploadRequest: sock.updateMediaMessage }
    );

    const temp = `./hd-${Date.now()}.jpg`;
    fs.writeFileSync(temp, buffer);

    const image = await Jimp.read(temp);
    image
      .contrast(0.2)
      .brightness(0.5)
      .normalize()
      .quality(90);
    await image.writeAsync(temp);

    const hasil = fs.readFileSync(temp);
    await sock.sendMessage(from, {
      image: hasil,
      caption: '✅ Ini gambar versi HD-nya ✨'
    }, { quoted: msg });

    fs.unlinkSync(temp);
  } catch (err) {
    console.error('❌ HD Error:', err);
    await sock.sendMessage(from, {
      text: '⚠️ Gagal memproses gambar. Coba reply ulang gambarnya.'
    }, { quoted: msg });
  }
}

// 🧼 .removebg
if (text === '.removebg') {
  try {
    const context = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = context?.quotedMessage?.imageMessage;

    if (!quoted) {
      return sock.sendMessage(from, {
        text: '❌ Reply gambar lalu ketik *.removebg* untuk menghapus background.'
      }, { quoted: msg });
    }

    const buffer = await downloadMediaMessage(
      { message: { imageMessage: quoted } },
      'buffer',
      {},
      { logger: console, reuploadRequest: sock.updateMediaMessage }
    );

    const tempInput = `./temp-in-${Date.now()}.jpg`;
    const tempOutput = `./temp-out-${Date.now()}.png`;
    fs.writeFileSync(tempInput, buffer);

    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: {
        image_file_b64: buffer.toString('base64'),
        size: 'auto'
      },
      headers: {
        'X-Api-Key': removebgApiKey
      },
      responseType: 'arraybuffer'
    });

    if (response.data) {
      fs.writeFileSync(tempOutput, response.data);

      await sock.sendMessage(from, {
        image: fs.readFileSync(tempOutput),
        caption: '✅ Background berhasil dihapus!'
      }, { quoted: msg });

      fs.unlinkSync(tempInput);
      fs.unlinkSync(tempOutput);
    } else {
      throw new Error('No data dari remove.bg');
    }
  } catch (err) {
    console.error('❌ RemoveBG Error:', err.message);
    return sock.sendMessage(from, {
      text: '⚠️ Gagal menghapus background. Coba ulangi atau cek API Key.'
    }, { quoted: msg });
  }
}

  // 🖼️ .stiker
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

  // 💬 .addbrat
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
