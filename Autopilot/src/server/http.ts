import { NextResponse } from 'next/server'

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function error(message: string, status = 500) {
  return json({ error: message }, { status })
}
