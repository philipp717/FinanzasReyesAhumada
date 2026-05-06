import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'CLP'): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function getCurrentMonth(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export const CATEGORY_LABELS: Record<string, string> = {
  supermercado: 'Supermercado',
  mercaderia: 'Mercadería',
  ropa: 'Ropa',
  salud: 'Salud',
  educacion: 'Educación',
  transporte: 'Transporte',
  servicios: 'Servicios básicos',
  arriendo: 'Arriendo / Dividendo',
  transferencia: 'Transferencias',
  deuda: 'Deudas',
  mascotas: 'Mascotas',
  entretenimiento: 'Entretenimiento',
  sueldo: 'Sueldo / Ingreso',
  otro: 'Otro',
  // Debt categories
  tarjeta_credito: 'Tarjeta de crédito',
  credito_bancario: 'Crédito bancario',
  deuda_efectivo: 'Deuda en efectivo',
  prestamo_personal: 'Préstamo personal',
  cuota_auto: 'Cuota de auto',
  arriendo_atrasado: 'Arriendo atrasado',
  deuda_servicios: 'Deuda de servicios',
  otro_deuda: 'Otra deuda',
}

export const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
  transferencia: 'Transferencia',
  cuenta_ahorro: 'Cuenta de ahorro',
  cheque: 'Cheque',
  whatsapp: 'WhatsApp',
}

export const CATEGORY_COLORS: Record<string, string> = {
  supermercado: '#EDF3EC',
  mercaderia: '#E1F3FE',
  ropa: '#FBF3DB',
  salud: '#FDEBEC',
  educacion: '#E1F3FE',
  transporte: '#FBF3DB',
  servicios: '#FDEBEC',
  arriendo: '#EDF3EC',
  transferencia: '#E1F3FE',
  deuda: '#FDEBEC',
  mascotas: '#EDF3EC',
  entretenimiento: '#FBF3DB',
  sueldo: '#EDF3EC',
  otro: '#F7F6F3',
}
