import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import qrcode from 'qrcode-terminal'
import pino from 'pino'

let sockInstance = null

export async function connectToWhatsApp(onMessage) {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`Baileys versión: ${version.join('.')}${isLatest ? ' (latest)' : ''}`)

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
  })

  sockInstance = sock

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📱 Escanea este QR con WhatsApp > Dispositivos vinculados:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const statusCode = /** @type {Boom} */ (lastDisconnect?.error)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log('Conexión cerrada. Código:', statusCode, '| Reconectar:', shouldReconnect)
      if (lastDisconnect?.error) console.log('Error:', lastDisconnect.error.message)
      if (shouldReconnect) {
        connectToWhatsApp(onMessage)
      } else {
        console.log('Sesión cerrada. Elimina auth_info_baileys/ y reinicia.')
      }
    } else if (connection === 'open') {
      console.log('✅ Conectado a WhatsApp')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const msg = messages[0]
    if (!msg || msg.key.fromMe) return
    await onMessage(sock, msg)
  })

  return sock
}

export function getSock() {
  return sockInstance
}

export async function sendMessage(jid, text) {
  if (!sockInstance) throw new Error('WhatsApp no está conectado')
  await sockInstance.sendMessage(jid, { text })
}

export { downloadMediaMessage }
