import 'dotenv/config'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { connectToWhatsApp, sendMessage, downloadMediaMessage } from './whatsapp.js'
import { extractTransactionFromText, extractTransactionFromImage, chatResponse } from './gemini.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── Session state machine ────────────────────────────────────────────────────
// Per-user interactive conversation sessions
// jid → { userId, userName, state, tx, pendingFields, currentField, receiptUrl, allTxs, startedAt }

const sessions = new Map()
const SESSION_TIMEOUT_MS = 8 * 60 * 1000 // 8 minutes

setInterval(() => {
  const now = Date.now()
  for (const [jid, s] of sessions) {
    if (now - s.startedAt > SESSION_TIMEOUT_MS) sessions.delete(jid)
  }
}, 60_000)

// ─── Category display labels ──────────────────────────────────────────────────

const CATEGORY_DISPLAY = {
  supermercado: 'Supermercado', mercaderia: 'Mercadería', ropa: 'Ropa',
  salud: 'Salud', educacion: 'Educación', transporte: 'Transporte',
  servicios: 'Servicios', arriendo: 'Arriendo', transferencia: 'Transferencia',
  mascotas: 'Mascotas', entretenimiento: 'Entretenimiento',
  sueldo: 'Sueldo / Ingreso', otro: 'Otro',
  tarjeta_credito: 'Tarjeta de crédito', credito_bancario: 'Crédito bancario',
  deuda_efectivo: 'Deuda en efectivo', prestamo_personal: 'Préstamo personal',
  cuota_auto: 'Cuota de auto', arriendo_atrasado: 'Arriendo atrasado',
  deuda_servicios: 'Deuda de servicios', otro_deuda: 'Otra deuda',
}

const TYPE_EMOJI = { gasto: '📉', ingreso: '📈', ahorro: '💰', deuda: '⚠️' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUserByPhone(phone) {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('phone_number', phone)
    .single()
  return data
}

async function buildFinancialContext(userId) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const { data: txs } = await supabase
    .from('transactions').select('type, amount').eq('user_id', userId).gte('date', start).lte('date', end)
  const income = (txs ?? []).filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const expenses = (txs ?? []).filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
  const savings = (txs ?? []).filter(t => t.type === 'ahorro').reduce((s, t) => s + t.amount, 0)
  return `Mes actual — Ingresos: $${income.toLocaleString('es-CL')}, Gastos: $${expenses.toLocaleString('es-CL')}, Ahorro: $${savings.toLocaleString('es-CL')}`
}

async function uploadReceiptToStorage(buffer, mimeType, userId) {
  try {
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg'
    const filename = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('receipts')
      .upload(filename, buffer, { contentType: mimeType, upsert: false })
    if (error) { console.error('Storage upload error:', error.message); return null }
    const { data } = supabase.storage.from('receipts').getPublicUrl(filename)
    return data.publicUrl
  } catch (err) {
    console.error('Upload failed:', err.message)
    return null
  }
}

// ─── Field Q&A helpers ────────────────────────────────────────────────────────

function fieldQuestion(field, txType) {
  switch (field) {
    case 'type':
      return '¿Qué tipo de transacción es?\n\n📉 *gasto* — un pago o compra\n📈 *ingreso* — sueldo u otro ingreso\n💰 *ahorro* — aporte a una meta\n⚠️ *deuda* — pago de deuda o crédito\n\nResponde con una de las opciones.'
    case 'amount':
      return '💵 ¿Cuál fue el monto total?\n\nEscribe solo el número (en pesos chilenos).\nEjemplo: *15990*'
    case 'category':
      if (txType === 'deuda') {
        return '🏷 ¿Qué tipo de deuda es?\n\n💳 *tarjeta* — Tarjeta de crédito\n🏦 *credito* — Crédito bancario\n💵 *efectivo* — Deuda en efectivo\n👤 *prestamo* — Préstamo personal\n🚗 *auto* — Cuota de auto\n🏠 *arriendo* — Arriendo atrasado\n⚡ *servicios* — Deuda de servicios\n📦 *otro* — Otra deuda\n\nResponde con la opción más cercana.'
      }
      return '🏷 ¿En qué categoría va?\n\n🛒 *supermercado*  🥩 *mercaderia*  👕 *ropa*\n💊 *salud*  📚 *educacion*  🚗 *transporte*\n💡 *servicios*  🏠 *arriendo*  🎬 *entretenimiento*\n🐾 *mascotas*  💸 *otro*\n\nResponde con el nombre.'
    default:
      return null
  }
}

function parseFieldAnswer(field, answer, txType) {
  const a = answer.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  if (field === 'type') {
    if (a.startsWith('gasto') || a === 'g') return 'gasto'
    if (a.startsWith('ingreso') || a === 'i') return 'ingreso'
    if (a.startsWith('ahorro') || a === 'a') return 'ahorro'
    if (a.startsWith('deuda') || a === 'd') return 'deuda'
    return null
  }

  if (field === 'amount') {
    const num = parseFloat(a.replace(/[^\d.,]/g, '').replace(',', '.'))
    return isNaN(num) || num <= 0 ? null : Math.round(num)
  }

  if (field === 'category') {
    if (txType === 'deuda') {
      if (a.includes('tarjeta') || a === 'tarjeta') return 'tarjeta_credito'
      if (a.includes('credito') || a === 'credito') return 'credito_bancario'
      if (a.includes('efectivo') || a === 'efectivo') return 'deuda_efectivo'
      if (a.includes('prestamo') || a === 'prestamo') return 'prestamo_personal'
      if (a.includes('auto') || a === 'auto') return 'cuota_auto'
      if (a.includes('arriendo') || a === 'arriendo') return 'arriendo_atrasado'
      if (a.includes('servicio') || a === 'servicios') return 'deuda_servicios'
      return 'otro_deuda'
    }
    const catMap = {
      supermercado: 'supermercado', super: 'supermercado',
      mercaderia: 'mercaderia', mercado: 'mercaderia',
      ropa: 'ropa', calzado: 'ropa',
      salud: 'salud', farmacia: 'salud', clinica: 'salud', medico: 'salud',
      educacion: 'educacion', colegio: 'educacion', universidad: 'educacion',
      transporte: 'transporte', taxi: 'transporte', uber: 'transporte', bip: 'transporte',
      servicios: 'servicios', luz: 'servicios', agua: 'servicios', gas: 'servicios', internet: 'servicios',
      arriendo: 'arriendo', dividendo: 'arriendo',
      entretenimiento: 'entretenimiento', cine: 'entretenimiento', juego: 'entretenimiento',
      mascotas: 'mascotas', mascota: 'mascotas',
      otro: 'otro',
    }
    for (const [key, val] of Object.entries(catMap)) {
      if (a.includes(key)) return val
    }
    return null
  }

  return null
}

function getMissingFields(tx) {
  const missing = [...(tx.missingFields ?? [])]
  if (!tx.type && !missing.includes('type')) missing.push('type')
  if ((!tx.amount || tx.amount <= 0) && !missing.includes('amount')) missing.push('amount')
  if (!tx.category && tx.type !== 'ingreso' && tx.type !== 'ahorro' && !missing.includes('category')) missing.push('category')
  return [...new Set(missing)]
}

function formatTxSummary(tx, index = null) {
  const emoji = TYPE_EMOJI[tx.type] ?? '💵'
  const amount = `$${Math.round(tx.amount).toLocaleString('es-CL')}`
  const cat = CATEGORY_DISPLAY[tx.category] ?? tx.category ?? 'General'
  const desc = tx.description ? `\n   📝 ${tx.description}` : ''
  const prefix = index !== null ? `*${index + 1}.* ` : ''
  return `${prefix}${emoji} *${tx.type?.charAt(0).toUpperCase() + tx.type?.slice(1)}*\n   💵 ${amount}  🏷 ${cat}${desc}`
}

async function showConfirmation(jid, session) {
  session.state = 'confirming'
  session.startedAt = Date.now()

  const all = session.allTxs
  const receiptLine = session.receiptUrl ? '\n\n📎 _Comprobante guardado_' : ''
  const summaryLines = all.length === 1
    ? formatTxSummary(all[0])
    : all.map((t, i) => formatTxSummary(t, i)).join('\n\n')

  await sendMessage(
    jid,
    `✅ *Listo para registrar:*\n\n${summaryLines}${receiptLine}\n\n¿Confirmamos?\nResponde *SÍ* para guardar o *NO* para cancelar.`
  )
}

// ─── Flujo: Vinculación ───────────────────────────────────────────────────────

async function handleLinking(jid, phone, bodyText) {
  const token = bodyText.split(' ')[1]?.trim()
  if (!token) {
    await sendMessage(jid, '❌ Token inválido. Escanea el QR nuevamente desde *Fami → Configuración*.')
    return
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('whatsapp_link_token', token)
    .single()

  if (error || !profile) {
    await sendMessage(jid, '❌ QR no encontrado o ya fue usado. Ve a *Configuración* y genera uno nuevo.')
    return
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ phone_number: phone, whatsapp_linked_at: new Date().toISOString(), whatsapp_link_token: null })
    .eq('id', profile.id)

  if (updateError) {
    await sendMessage(jid, '❌ Error al vincular. Intenta de nuevo.')
    return
  }

  const firstName = profile.full_name?.split(' ')[0] ?? 'amigo/a'
  await sendMessage(
    jid,
    `🎉 ¡Hola ${firstName}! Tu WhatsApp ya está vinculado a *Fami*.\n\n` +
    `Puedo ayudarte con:\n` +
    `📸 Envíame una *foto de una boleta* o ticket\n` +
    `💬 Escríbeme *"gasté 5000 en supermercado"*\n` +
    `💳 Mándame una *captura de transferencia* o estado de cuenta\n` +
    `❓ Hazme *preguntas sobre tus finanzas*\n\n` +
    `Todo queda registrado automáticamente en Fami. ¿Empezamos?`
  )
}

// ─── Flujo: Respuesta a sesión activa ─────────────────────────────────────────

async function handleSessionReply(jid, text, session) {
  session.startedAt = Date.now()

  if (session.state === 'confirming') {
    const norm = text.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const isYes = norm === 'si' || norm === 's' || norm === 'yes' || norm.startsWith('si') || norm === 'confirmar' || norm === 'ok' || norm === 'dale'
    const isNo = norm === 'no' || norm === 'n' || norm === 'cancelar'

    if (!isYes && !isNo) {
      await sendMessage(jid, '¿Confirmamos? Responde *SÍ* para guardar o *NO* para cancelar.')
      return
    }

    if (isNo) {
      sessions.delete(jid)
      await sendMessage(jid, '❌ Cancelado. No se guardó nada. ¿Te puedo ayudar con otra cosa?')
      return
    }

    // Save all transactions
    const today = new Date().toISOString().split('T')[0]
    const rows = session.allTxs.map(tx => ({
      user_id: session.userId,
      type: tx.type,
      amount: Math.round(tx.amount),
      category: tx.type === 'ingreso' ? 'sueldo' : (tx.category || 'otro'),
      description: tx.description ?? '',
      payment_method: 'whatsapp',
      date: tx.date ?? today,
      receipt_url: session.receiptUrl ?? null,
    }))

    const { error } = await supabase.from('transactions').insert(rows)
    sessions.delete(jid)

    if (error) {
      console.error('Error inserting transactions:', error)
      await sendMessage(jid, '❌ Error al guardar. Intenta de nuevo.')
      return
    }

    const plural = rows.length > 1 ? `${rows.length} transacciones guardadas` : 'Transacción guardada'
    await sendMessage(jid, `✅ *${plural}* en Fami.\n\nYa aparecen en la app en tiempo real${session.receiptUrl ? ' con el comprobante adjunto' : ''}. ¿Algo más?`)
    return
  }

  // state === 'asking' — handle answer to current pending field
  const parsed = parseFieldAnswer(session.currentField, text, session.tx.type)

  if (parsed === null) {
    const q = fieldQuestion(session.currentField, session.tx.type)
    await sendMessage(jid, `❓ No entendí eso. ${q}`)
    return
  }

  // Update the first transaction's field (main one being filled)
  session.tx[session.currentField] = parsed
  session.allTxs[session.activeIndex][session.currentField] = parsed

  // Special: if we just got type for ingreso/ahorro, skip category
  if (session.currentField === 'type' && (parsed === 'ingreso' || parsed === 'ahorro')) {
    session.pendingFields = session.pendingFields.filter(f => f !== 'category')
  }

  if (session.pendingFields.length > 0) {
    session.currentField = session.pendingFields.shift()
    await sendMessage(jid, fieldQuestion(session.currentField, session.tx.type))
  } else {
    await showConfirmation(jid, session)
  }
}

// ─── Flujo: Mensaje de texto ──────────────────────────────────────────────────

async function handleTextMessage(jid, text, user) {
  await sendMessage(jid, '🔍 Procesando...')
  const extracted = await extractTransactionFromText(text)

  if (!extracted.isFinancial || extracted.transactions.length === 0) {
    const ctx = await buildFinancialContext(user.id)
    const reply = await chatResponse(text, ctx)
    await sendMessage(jid, reply)
    return
  }

  const txs = extracted.transactions
  const primary = txs[0]
  const missing = getMissingFields(primary)

  const session = {
    userId: user.id,
    userName: user.full_name,
    state: 'asking',
    tx: { ...primary, date: primary.date ?? null },
    pendingFields: [...missing],
    currentField: null,
    allTxs: txs,
    activeIndex: 0,
    receiptUrl: null,
    startedAt: Date.now(),
  }
  sessions.set(jid, session)

  if (missing.length === 0) {
    await showConfirmation(jid, session)
  } else {
    session.currentField = session.pendingFields.shift()
    await sendMessage(jid, fieldQuestion(session.currentField, session.tx.type))
  }
}

// ─── Flujo: Imagen ────────────────────────────────────────────────────────────

async function handleImageMessage(sock, jid, msg, user) {
  await sendMessage(jid, '📸 Recibida. Analizando con IA...')

  try {
    const buffer = await downloadMediaMessage(
      msg, 'buffer', {},
      {
        logger: { warn: () => {}, debug: () => {}, info: () => {}, error: () => {}, trace: () => {}, child: () => ({}) },
        reuploadRequest: sock.updateMediaMessage,
      }
    )
    const mimeType = msg.message.imageMessage?.mimetype ?? 'image/jpeg'

    // Upload to Supabase Storage immediately
    const receiptUrl = await uploadReceiptToStorage(buffer, mimeType, user.id)

    const extracted = await extractTransactionFromImage(buffer, mimeType)

    if (!extracted.isFinancial || extracted.transactions.length === 0) {
      await sendMessage(
        jid,
        '🤔 No encontré transacciones en la imagen.\n\nPuedes describirla en texto, por ejemplo:\n*"Pagué $15.990 en Líder hoy"*'
      )
      return
    }

    const txs = extracted.transactions
    const primary = txs[0]
    const missing = getMissingFields(primary)

    // If multiple transactions extracted, skip interactive Q&A and go straight to confirm
    const skipQA = txs.length > 1

    const session = {
      userId: user.id,
      userName: user.full_name,
      state: 'asking',
      tx: { ...primary, date: primary.date ?? null },
      pendingFields: skipQA ? [] : [...missing],
      currentField: null,
      allTxs: txs,
      activeIndex: 0,
      receiptUrl,
      startedAt: Date.now(),
    }
    sessions.set(jid, session)

    if (session.pendingFields.length === 0) {
      await showConfirmation(jid, session)
    } else {
      session.currentField = session.pendingFields.shift()
      await sendMessage(jid, `Encontré una transacción en la imagen. Solo necesito un par de datos más:\n\n${fieldQuestion(session.currentField, session.tx.type)}`)
    }
  } catch (err) {
    console.error('Error procesando imagen:', err)
    await sendMessage(jid, '❌ No pude procesar la imagen. ¿Puedes describirla en texto?')
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function handleMessage(sock, msg) {
  const jid = msg.key.remoteJid
  if (!jid) return

  const phone = jid.replace('@s.whatsapp.net', '')
  const bodyText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
  const hasImage = !!msg.message?.imageMessage

  // 1. Vinculación
  if (bodyText.toLowerCase().startsWith('vincular ')) {
    await handleLinking(jid, phone, bodyText)
    return
  }

  // 2. Sesión activa — respuesta a Q&A o confirmación
  if (sessions.has(jid)) {
    if (bodyText.trim()) {
      await handleSessionReply(jid, bodyText, sessions.get(jid))
    }
    return
  }

  // 3. Buscar usuario
  const user = await getUserByPhone(phone)
  if (!user) {
    await sendMessage(
      jid,
      '👋 ¡Hola! No reconozco este número en Fami.\n\nPara usarme:\n1. Abre *Fami → Configuración*\n2. Escanea el QR con este WhatsApp\n3. ¡Listo!'
    )
    return
  }

  // 4. Imagen
  if (hasImage) {
    await handleImageMessage(sock, jid, msg, user)
    return
  }

  // 5. Texto
  if (bodyText.trim()) {
    await handleTextMessage(jid, bodyText, user)
    return
  }

  await sendMessage(jid, '¿En qué te ayudo? Puedes enviarme un mensaje de texto, foto de boleta o pregunta sobre tus finanzas 💬')
}

// ─── Express + arranque ───────────────────────────────────────────────────────

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: sessions.size, timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`\n🚀 Fami WhatsApp Bot corriendo en puerto ${PORT}`)
  connectToWhatsApp(handleMessage).catch(console.error)
})
