import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithGemini, generateEmbedding } from '@/lib/gemini'
import { queryFinancialContext } from '@/lib/pinecone'
import { getCurrentMonth } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { message, history } = await req.json()

    // Get current month summary from DB
    const { start, end } = getCurrentMonth()
    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount, category, description, date')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)

    const totalIncome = txs?.filter((t) => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0) ?? 0
    const totalExpenses = txs?.filter((t) => t.type === 'gasto').reduce((s, t) => s + t.amount, 0) ?? 0
    const totalSavings = txs?.filter((t) => t.type === 'ahorro').reduce((s, t) => s + t.amount, 0) ?? 0

    // Query Pinecone for semantically similar transactions
    let pineconeContext = ''
    try {
      const queryEmbedding = await generateEmbedding(message)
      pineconeContext = await queryFinancialContext(user.id, queryEmbedding)
    } catch {
      // Pinecone not configured yet — continue without it
    }

    const financialContext = `
Resumen financiero del mes actual:
- Ingresos totales: $${totalIncome.toLocaleString('es-CL')}
- Gastos totales: $${totalExpenses.toLocaleString('es-CL')}
- Ahorro del mes: $${totalSavings.toLocaleString('es-CL')}
- Saldo disponible: $${(totalIncome - totalExpenses - totalSavings).toLocaleString('es-CL')}
${pineconeContext ? `\nTransacciones relevantes:\n${pineconeContext}` : ''}
    `.trim()

    const response = await chatWithGemini(message, financialContext, history ?? [])

    return NextResponse.json({ response })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Error al procesar el mensaje' }, { status: 500 })
  }
}
