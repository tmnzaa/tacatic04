const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const P = require('pino')
const { Boom } = require('@hapi/boom')
const schedule = require('node-schedule')
const fs = require('fs-extra')
const axios = require('axios')

// === File Database ===
const dbFile = './grup.json'
const backupFile = './backup_grup.json'

// Pemulihan otomatis saat file hilang/rusak
let db = {}
if (!fs.existsSync(dbFile)) {
  console.warn('⚠️ grup.json tidak ditemukan. Coba pulihkan dari backup...')
  if (fs.existsSync(backupFile)) {
    fs.copyFileSync(backupFile, dbFile)
    db = fs.readJsonSync(dbFile)
    console.log('✅ grup.json dipulihkan dari backup.')
  } else {
    console.warn('❌ Tidak ada backup. Membuat file kosong.')
    fs.writeJsonSync(dbFile, {})
    db = {}
  }
} else {
  try {
    db = fs.readJsonSync(dbFile)
  } catch (err) {
    console.error('❌ grup.json rusak! Pulihkan dari backup jika ada...')
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, dbFile)
      db = fs.readJsonSync(dbFile)
      console.log('✅ grup.json dipulihkan dari backup.')
    } else {
      console.error('❌ Tidak ada backup. Grup dimulai kosong.')
      db = {}
    }
  }
}

let qrShown = false

function resetFiturSaatRestart() {
  if (!fs.existsSync(dbFile)) return
  const db = fs.readJsonSync(dbFile)
  let totalReset = 0
  for (const id in db) {
    const fitur = db[id]
    fitur.antilink1 = false
    fitur.antilink2 = false
    fitur.antipromosi = false
    fitur.antitoxic = false
    fitur.welcome = false
    fitur.leave = false
    fitur.antipolling = false
    totalReset++
  }
fs.writeJsonSync(dbFile, db, { spaces: 2 })
fs.copyFileSync(dbFile, backupFile) // backup otomatis
  console.log(`♻️ Semua fitur dimatikan di ${totalReset} grup karena restart.`)
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !qrShown) {
      qrShown = true
      console.log('\n📲 Scan QR untuk login:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ Bot berhasil terhubung ke WhatsApp!')
      // resetFiturSaatRestart()
    }

    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode
      const reconnect = code !== DisconnectReason.loggedOut
      console.log('❌ Terputus. Reconnect:', reconnect)
      qrShown = false
if (reconnect) {
  setTimeout(() => {
    startBot()
  }, 5000) // kasih delay 5 detik biar nggak spam reconnect
}
    }
  })

  // 📥 Message handler
sock.ev.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0]
  if (!msg.message) return
  if (!msg.key.remoteJid || msg.key.id.startsWith('BAE5') || msg.key.fromMe) return

  const from = msg.key.remoteJid
  const sender = msg.key.participant || msg.key.remoteJid
  const db = fs.readJsonSync(dbFile)
  const fitur = db[from]

  // ✅ ANTIPOLLING
  if (fitur?.antipolling && msg.message.pollCreationMessage) {
    console.log('🚫 Deteksi polling dari:', sender)

    await sock.sendMessage(from, {
      text: `❌ @${sender.split('@')[0]} dilarang kirim polling di grup ini.`,
      mentions: [sender]
    })

    try {
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: msg.key.id,
          participant: sender
        }
      })
      console.log('✅ Polling berhasil dihapus.')
    } catch (err) {
      console.error('❌ Gagal hapus polling:', err)
    }
    return
  }

  // Handler lain
  try {
    require('./grup')(sock, msg)
    require('./private')(sock, msg)
  } catch (err) {
    console.error('💥 Error handle pesan:', err)
  }
})

  // 👋 WELCOME & LEAVE Feature: PP user + Custom teks + WhatsApp-style
sock.ev.on('group-participants.update', async (update) => {
  const db = fs.readJsonSync(dbFile)
  const fitur = db[update.id]
  if (!fitur) return

  try {
    const metadata = await sock.groupMetadata(update.id)

    for (const jid of update.participants) {
      const name = metadata.participants.find(p => p.id === jid)?.notify || 'Teman baru'
      const groupName = metadata.subject
      const pp = await sock.profilePictureUrl(jid, 'image').catch(() => 'https://i.ibb.co/dG6kR8k/avatar-group.png')

      // WELCOME
      if (update.action === 'add' && fitur.welcome) {
        let teks = fitur.welcomeText || `hello @name, selamat datang di *@grup*!`
        teks = teks
          .replace(/@user/g, `@${jid.split('@')[0]}`)
          .replace(/@name/g, name)
          .replace(/@grup/g, groupName)

        await sock.sendMessage(update.id, {
          image: { url: pp },
          caption: teks,
          mentions: [jid]
        })
      }

      // LEAVE
      if (update.action === 'remove' && fitur.leave) {
        const teks = `@${jid.split('@')[0]} yahh ko keluar si:) *${groupName}*.`
        await sock.sendMessage(update.id, {
          image: { url: pp },
          caption: teks,
          mentions: [jid]
        })
      }
    }
  } catch (err) {
    console.error('❌ Error welcome/leave:', err)
  }
})

// ⏰ AUTO OPEN & CLOSE GROUP — dengan delay awal
setTimeout(() => {
  schedule.scheduleJob('* * * * *', async () => {
    const now = new Date()
    const jam = now.toTimeString().slice(0, 5).replace(':', '.')
    const db = fs.readJsonSync(dbFile)

    for (const id in db) {
      const fitur = db[id]
      if (!fitur || !fitur.expired || new Date(fitur.expired) < now) continue

      try {
  if (!sock?.ws?.readyState || sock.ws.readyState !== 1) {
    console.log(`⚠️ WS belum siap untuk grup ${id}, lewati.`)
    continue
  }

  const metadata = await sock.groupMetadata(id) // <= ini penting ditambahkan

  const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
  const isAdmin = metadata.participants.some(p => p.id === botNumber && p.admin)

        if (!isAdmin) {
          console.log(`⚠️ Bot bukan admin di grup "${metadata.subject}", lewati pengaturan.`)
          continue
        }

        if (fitur.openTime === jam) {
          await sock.groupSettingUpdate(id, 'not_announcement')
          await sock.sendMessage(id, { text: `✅ Grup dibuka otomatis jam *${jam}*` })
          delete fitur.openTime
        }

        if (fitur.closeTime === jam) {
          await sock.groupSettingUpdate(id, 'announcement')
          await sock.sendMessage(id, { text: `🔒 Grup ditutup otomatis jam *${jam}*` })
          delete fitur.closeTime
        }

      } catch (err) {
        console.error(`❌ Gagal update setting grup ${id}:`, err.message)
      }
    }

    fs.writeJsonSync(dbFile, db, { spaces: 2 })
    fs.copyFileSync(dbFile, backupFile)
  })
}, 5000) // <- Delay 5 detik sebelum mulai schedule
}

// 🛠 Global error
process.on('unhandledRejection', err => {
  console.error('💥 Unhandled Rejection:', err)
})

startBot()
