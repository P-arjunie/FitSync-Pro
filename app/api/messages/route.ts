// app/api/messages/route.ts
import { NextResponse } from "next/server"

let messages: Record<number, any[]> = {
  1: [
    {
      id: 1,
      sender: "client",
      text: "Hello coach! Can't wait for our 1st session",
      time: "00:14",
    },
    {
      id: 2,
      sender: "therapist",
      text: "Neither can I! We'll focus on relieving your back tension.",
      time: "00:17",
    },
  ],
  2: [],
  3: [],
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const clientId = Number(searchParams.get("clientId"))
  return NextResponse.json(messages[clientId] || [])
}

export async function POST(req: Request) {
  const body = await req.json()
  const { clientId, sender, text, time } = body

  const newMessage = {
    id: messages[clientId]?.length + 1 || 1,
    sender,
    text,
    time,
  }

  if (!messages[clientId]) messages[clientId] = []
  messages[clientId].push(newMessage)

  return NextResponse.json(newMessage)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { clientId, messageId, newText } = body

  const msgList = messages[clientId]
  if (!msgList) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const msg = msgList.find(m => m.id === messageId)
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 })

  msg.text = newText
  return NextResponse.json(msg)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const clientId = Number(searchParams.get("clientId"))
  const messageId = Number(searchParams.get("messageId"))

  if (!messages[clientId]) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  messages[clientId] = messages[clientId].filter(m => m.id !== messageId)

  return NextResponse.json({ success: true })
}
