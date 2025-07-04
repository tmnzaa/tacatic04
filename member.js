const fs = require('fs');
const { exec } = require('child_process');
const Jimp = require('jimp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, msg, text, from) => {

  // === .menu untuk member biasa ===
  if (text === '.menu') {
     return sock.sendMessage(from, {
    text: `╔═══🎀 *TACATIC BOT 04 - MENU FITUR* 🎀═══╗

📛 *FITUR KEAMANAN*:
• 🚫 _.antilink1 on/off_  → Hapus link masuk
• 🚷 _.antilink2 on/off_  → Hapus link + tendang user
• 📢 _.antipromosi on/off_  → Blok iklan dan spam
• 🤬 _.antitoxic on/off_  → Bersihin kata-kata kasar

🎉 *FITUR SOSIAL & INTERAKSI*:
• 🎉 _.welcome on/off_  → Sambutan buat member baru
• 🗣️ _.tagall_  → Mention semua member aktif
• 👢 _.kick_  → Tendang member (admin only)

🛠️ *FITUR MANAJEMEN GRUP*:
• 👑 _.promote_  → Jadikan member jadi admin
• 🧹 _.demote_  → Turunin admin
• 🔓 _.open_ / _.open 20.00_  → Buka grup / jadwal buka
• 🔒 _.close_ / _.close 22.00_  → Tutup grup / jadwal tutup
• 💡 _.cekaktif_      → Cek fitur aktif

📊 *FITUR LAINNYA*:
• 🖼️ _.stiker_        → Buat stiker dari gambar
• 🔤 _.addbrat teks_  → Buat stiker teks brat

Contoh:
• Kirim/reply gambar lalu ketik _.stiker_
• _.addbrat Stiker teks_

📌 *Catatan*:
– Hanya admin atau owner grup yang bisa akses fitur.
– Pastikan bot sudah dijadikan admin supaya bisa bekerja maksimal.

╚═════════════════════════╝`
  }, { quoted: msg });
}

  // === .stiker untuk member biasa ===
  if (text === '.stiker') {
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const mediaMessage = quoted?.imageMessage || msg?.message?.imageMessage;

    if (!mediaMessage) {
      return sock.sendMessage(from, {
        text: '❌ Kirim atau reply gambar dengan perintah *.stiker*'
      }, { quoted: msg });
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
        exec(cmd, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const stickerBuffer = fs.readFileSync(outputPath);

      await sock.sendMessage(from, {
        sticker: stickerBuffer,
        mimetype: 'image/webp'
      }, { quoted: msg });

      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    } catch (err) {
      console.error('❌ stiker error:', err);
      await sock.sendMessage(from, {
        text: '⚠️ Gagal membuat stiker!'
      }, { quoted: msg });
    }
  }

  // === .addbrat untuk member biasa ===
  if (text.startsWith('.addbrat ')) {
    const teks = text.split('.addbrat ')[1].trim();
    if (!teks) {
      return sock.sendMessage(from, {
        text: '❌ Masukkan teks!\nContoh: *.addbrat semangat ya*'
      }, { quoted: msg });
    }

    try {
      const filename = Date.now();
      const pngPath = `./${filename}.png`;
      const webpPath = `./${filename}.webp`;

      const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
      const image = new Jimp(512, 512, 0xFFFFFFFF); // latar putih

      const wrapText = (text) => {
        const words = text.split(' ');
        const lines = [];
        let line = [];

        for (let i = 0; i < words.length; i++) {
          line.push(words[i]);
          if (line.length === 2 || i === words.length - 1) {
            lines.push(line.join('     ')); // spasi acak
            line = [];
          }
        }
        return lines.join('\n');
      };

      const wrappedText = wrapText(teks);

      image.print(
        font,
        0,
        0,
        {
          text: wrappedText,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        },
        512,
        512
      );

      image.quality(100);
      await image.writeAsync(pngPath);

      await new Promise((resolve, reject) => {
        const cmd = `convert "${pngPath}" -resize 512x512^ -gravity center -extent 512x512 -quality 100 "${webpPath}"`;
        exec(cmd, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const buffer = fs.readFileSync(webpPath);

      await sock.sendMessage(from, {
        sticker: buffer,
        mimetype: 'image/webp'
      }, { quoted: msg });

      fs.unlinkSync(pngPath);
      fs.unlinkSync(webpPath);
    } catch (err) {
      console.error('❌ addbrat error:', err);
      await sock.sendMessage(from, {
        text: '⚠️ Gagal membuat stiker!'
      }, { quoted: msg });
    }
  }
}
