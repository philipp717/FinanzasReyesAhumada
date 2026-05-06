import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      phone_number: null,
      whatsapp_linked_at: null,
      whatsapp_link_token: null,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Error al desvincular' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
