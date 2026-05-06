import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const token = crypto.randomUUID()
  const botNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ?? ''
  const waUrl = `https://wa.me/${botNumber}?text=vincular+${token}`

  const { error } = await supabase
    .from('profiles')
    .update({
      whatsapp_link_token: token,
      phone_number: null,
      whatsapp_linked_at: null,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Error generando token' }, { status: 500 })
  }

  return NextResponse.json({ token, waUrl })
}
