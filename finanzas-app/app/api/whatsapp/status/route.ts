import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function maskPhone(phone: string): string {
  if (phone.length < 4) return '****'
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_number, whatsapp_linked_at, whatsapp_link_token')
    .eq('id', user.id)
    .single()

  const linked = !!profile?.phone_number

  return NextResponse.json({
    linked,
    phone: linked ? maskPhone(profile!.phone_number!) : null,
    linkedAt: profile?.whatsapp_linked_at ?? null,
    token: profile?.whatsapp_link_token ?? null,
  })
}
