import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

const EXTRACTION_PROMPT = `Eres un asistente financiero para Chile. Extrae transacciones de texto o imágenes de boletas, tickets, estados de cuenta o transferencias.

Responde ÚNICAMENTE con JSON válido sin texto adicional ni markdown:
{
  "isFinancial": boolean,
  "transactions": [
    {
      "type": "gasto" | "ingreso" | "ahorro" | "deuda" | null,
      "amount": number | null,
      "category": "supermercado" | "mercaderia" | "ropa" | "salud" | "educacion" | "transporte" | "servicios" | "arriendo" | "transferencia" | "mascotas" | "entretenimiento" | "sueldo" | "otro" | null,
      "description": "string corto del comercio o concepto" | null,
      "date": "YYYY-MM-DD" | null,
      "missingFields": ["type", "amount", "category"]
    }
  ]
}

Reglas críticas:
- Si NO hay información financiera clara: isFinancial:false, transactions:[]
- Montos siempre positivos, en pesos chilenos (CLP)
- Infiere categoría por contexto: farmacia/clínica→salud, Uber/taxi/BIP→transporte, Líder/Jumbo/Walmart→supermercado, Netflix/Spotify/cine→entretenimiento, arriendo/dividendo→arriendo, luz/agua/gas/internet→servicios
- Un ingreso es sueldo, depósito recibido, transferencia recibida
- Un gasto es cualquier compra o pago
- Una deuda es pago de tarjeta de crédito, crédito, préstamo
- Un ahorro es depósito a cuenta de ahorro o AFP
- Si no puedes determinar con certeza type, amount o category → ponlos null e inclúyelos en missingFields
- date: null significa hoy
- description: nombre del comercio o concepto breve (máximo 30 caracteres)
- Si hay múltiples items en un ticket, suma el TOTAL general (no listes cada producto)
- Si hay múltiples transacciones distintas en una imagen (e.g. estado de cuenta), inclúyelas todas`

export async function extractTransactionFromText(text) {
  try {
    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      `Analiza este mensaje: "${text}"`,
    ])
    return parseGeminiResponse(result.response.text())
  } catch (err) {
    console.error('Gemini text extraction error:', err.message)
    return { isFinancial: false, transactions: [] }
  }
}

export async function extractTransactionFromImage(imageBuffer, mimeType) {
  try {
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType,
      },
    }
    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      imagePart,
      'Analiza esta imagen (boleta, ticket, captura bancaria o comprobante de transferencia). Extrae todas las transacciones financieras visibles.',
    ])
    return parseGeminiResponse(result.response.text())
  } catch (err) {
    console.error('Gemini image extraction error:', err.message)
    return { isFinancial: false, transactions: [] }
  }
}

function parseGeminiResponse(raw) {
  try {
    const json = raw.trim()
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')
      .trim()
    const parsed = JSON.parse(json)
    // Ensure missingFields is always an array
    if (parsed.transactions) {
      parsed.transactions = parsed.transactions.map(tx => ({
        ...tx,
        missingFields: tx.missingFields ?? inferMissingFields(tx),
      }))
    }
    return parsed
  } catch {
    return { isFinancial: false, transactions: [] }
  }
}

function inferMissingFields(tx) {
  const missing = []
  if (tx.type === null || tx.type === undefined) missing.push('type')
  if (tx.amount === null || tx.amount === undefined || tx.amount <= 0) missing.push('amount')
  if ((tx.category === null || tx.category === undefined) && tx.type !== 'ingreso' && tx.type !== 'ahorro') {
    missing.push('category')
  }
  return missing
}

export async function chatResponse(text, financialContext) {
  try {
    const systemPrompt = `Eres Fina, la asistente financiera de Fami. Eres amigable, directa y hablas en español chileno informal.
Ayudas a las personas a entender y mejorar sus finanzas personales.
Contexto financiero actual del usuario: ${financialContext}
Responde de forma concisa (máximo 3-4 oraciones). Sin markdown, solo texto plano con emojis si ayuda.`

    const result = await model.generateContent([systemPrompt, text])
    return result.response.text()
  } catch {
    return 'Lo siento, no pude procesar tu mensaje ahora. Intenta de nuevo en un momento.'
  }
}
