// app/trainer-chat/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { UserCircleIcon } from '@heroicons/react/24/solid'

type Message = {
  id: number
  sender: 'client' | 'therapist'
  text: string
  time: string
}

export default function TrainerChatPage() {
  const [selectedClient, setSelectedClient] = useState<number | null>(null)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')

  const clients = [
    { id: 1, name: 'Tharushi Madushani' },
    { id: 2, name: 'Jane Perera' },
    { id: 3, name: 'Amaya Silva' },
  ]

  useEffect(() => {
    if (!selectedClient) return

    const fetchMessages = async () => {
      const res = await fetch(`/api/messages?clientId=${selectedClient}`)
      const data = await res.json()
      setChatMessages(data)
    }

    fetchMessages()
  }, [selectedClient])

  const handleSendMessage = async () => {
    if (!message.trim() || selectedClient === null) return

    const now = new Date()
    const time = now.toTimeString().slice(0, 5)

    const res = await fetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        clientId: selectedClient,
        sender: 'therapist',
        text: message,
        time,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const newMsg = await res.json()
    setChatMessages(prev => [...prev, newMsg])
    setMessage('')
  }

  return (
    <div className="flex h-screen bg-gray-100 text-black">
      {/* Sidebar */}
      <div className="w-72 bg-black text-white p-4 border-r border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-red-600">My Clients</h2>
        <ul className="space-y-3">
          {clients.map(client => (
            <li
              key={client.id}
              onClick={() => setSelectedClient(client.id)}
              className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-red-600 transition ${
                selectedClient === client.id ? 'bg-red-600' : ''
              }`}
            >
              <UserCircleIcon className="h-8 w-8 text-white" />
              <span className="text-white">{client.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col bg-white p-6">
        <div className="text-2xl font-bold mb-4 text-red-600">
          {selectedClient
            ? `Chat with ${clients.find(c => c.id === selectedClient)?.name}`
            : 'Select a client'}
        </div>

        {selectedClient ? (
          <>
            <div
              className="relative flex-1 overflow-y-auto space-y-3 p-4 border-4 border-white rounded-lg shadow-inner"
              style={{
                backgroundImage: 'url("/MassageBg.jpg")',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-70 rounded-lg pointer-events-none" />

              <div className="relative z-10">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'therapist'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl shadow-sm ${
                        msg.sender === 'therapist'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-black'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className="text-xs text-right opacity-70 mt-1">
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              />
              <button
                onClick={handleSendMessage}
                className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-600 mt-10">Choose a client to start chatting.</p>
        )}
      </div>
    </div>
  )
}
