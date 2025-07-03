const fs = require('fs-extra')
const path = './data_user.json'
if (!fs.existsSync(path)) fs.writeJsonSync(path, {})

// 🎩 Nomor Owner Bot
const OWNER_NUM = '6282333014459'

module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
  if (from.endsWith('@g.us')) return // cuma buat chat pribadi yaa 🤖

  const db = fs.readJsonSync(path)
  db[from] = db[from] || {}

  // 💌 Sambutan lucu pertama kali chat
  if (!db[from].perkenalan) {
    db[from].perkenalan = true
    fs.writeJsonSync(path, db, { spaces: 2 })
    return sock.sendMessage(from, {
      text: `✨ Haii aku *Tacatic Bot 04* 🐣\n\nAku bot penjaga grup yang lucu nan sakti! ✨\n\n📌 Ketik *_.menu_* buat liat isi perutku~`
    })
  }

  // 📋 Menu utama lucu
  if (text.toLowerCase() === '.menu') {
    return sock.sendMessage(from, {
      text: `📋 *MENU UTAMA - TACATIC BOT 04*\n\n🌟 Aku bisa bantu kamu jagain grup lohh~\nPilih aja yang kamu mau:\n\n• 🎮 _.fitur_  – Liat semua kekuatan botku!\n• 💸 _.sewa_   – Info sewa (murce!)\n• 🙋‍♂️ _.owner_ – Chat abang owner botku 💌`
    })
  }

  // 🛡️ List fitur jaga grup + tambahan lainnya
if (text === '.fitur') {
  return sock.sendMessage(from, {
    text: `🛡️ *FITUR JAGA GRUP – TACATIC BOT 04*

Aku bisa bantu kamu jagain grup dari yang nakal-nakal 😼:

• 🚫 _.antilink1 on/off_ – Hapus link
• 🚷 _.antilink2 on/off_ – Hapus + Tendang!
• 📢 _.antipromosi on/off_ – Auto hapus iklan
• 🤬 _.antitoxic on/off_ – Bersihin kata kasar
• 🎉 _.welcome on/off_ – Sambutan lucu untuk member baru
• 🗣️ _.tagall_ – Panggil semua member
• 👢 _.kick_ – Tendang member (sopan)
• 👑 _.promote_ – Angkat jadi admin
• 🧹 _.demote_ – Turunin admin
• 🔓 _.open / .open 20.00_ – Buka grup (otomatis juga bisa!)
• 🔒 _.close / .close 22.00_ – Tutup grup (sesuai jam juga bisa!)

🎨 *FITUR STIKER & BRAT*:
• 🖼️ _.stiker_ – Kirim/reply gambar lalu ketik ini
• 🔤 _.addbrat teks_ – Buat stiker teks brat
• 😎 _.bratkeren teks_ – Stiker dengan foto profil dan teks lucu

👾 Powered by *Tacatic 04*`
  }, { quoted: msg });
}

  // 💸 Info sewa bot + penjelasan
  if (text === '.sewa') {
    return sock.sendMessage(from, {
      text: `🛡️ *SEBELUM SEWA BACA DULU YA!*\n\nBot ini bukan buat hiburan, bukan buat mainan sticker, fake reply, atau yang aneh-aneh 🙅‍♂️\n\nAku *Tacatic Bot 04*, adalah *Bot Penjaga Grup* 🧱.\nTugas utamaku adalah jadi *Security Bot*:\n- Hapus link & promosi\n- Tendang member spam/nakal\n- Jaga grup tetap aman & bersih ✨\n\nKalau kamu butuh penjaga grup yang kalem dan kerja keras, aku siap disewa 💼\n\n💰 *HARGA SEWA:*\n• 3K = 1 Minggu 🗓️\n• 5K = 1 Bulan 📆\n• 7K = 2 Bulan 📅\n\n📌 Ketik langsung di grup:\n_.aktifbot3k_ / _.aktifbot5k_ / _.aktifbot7k_\n\n⚠️ Aktivasi hanya bisa oleh *Owner Bot*\nTerima kasih udah tertarik pake jasa aku 🙏`
    })
  }

  // 👤 Owner info
  if (text === '.owner') {
    return sock.sendMessage(from, {
      text: `🙋‍♂️ *OWNER TACATIC BOT 04*\n\nKalau ada yang mau ditanyain, chat aja abangku:\n🌐 https://wa.me/${OWNER_NUM}\n\nJangan gombalin ya 🙈`
    })
  }

  // ✨ Jawaban default kalau chat bukan perintah
  const isCommand = ['.menu', '.fitur', '.sewa', '.owner'].includes(text.toLowerCase())
  if (!isCommand) {
    return sock.sendMessage(from, {
      text: `👋 Hai! Aku *Tacatic Bot 04* siap bantu kamu!\n\nKetik *_.menu_* buat mulai~`
    })
  }
}
