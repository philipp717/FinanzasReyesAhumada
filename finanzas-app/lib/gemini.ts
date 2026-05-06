import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: `Eres un asistente financiero familiar amigable y empático llamado "Fina".
Tu objetivo es ayudar a familias chilenas a entender y mejorar sus finanzas personales.

Reglas:
- Habla siempre en español, con lenguaje simple y cercano.
- Usa pesos chilenos (CLP) cuando menciones montos.
- Sé positivo y motivador, nunca juzgues los gastos del usuario.
- Da consejos prácticos y realistas para el contexto chileno.
- Cuando no tengas datos suficientes, pide más información amablemente.
- Responde de forma concisa, máximo 3-4 párrafos.
- Usa los datos financieros del usuario cuando estén disponibles en el contexto.`,
})

export async function chatWithGemini(
  userMessage: string,
  financialContext: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) {
  const chat = geminiModel.startChat({ history })

  const contextualMessage = financialContext
    ? `[Contexto financiero del usuario: ${financialContext}]\n\nPregunta: ${userMessage}`
    : userMessage

  const result = await chat.sendMessage(contextualMessage)
  return result.response.text()
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}
