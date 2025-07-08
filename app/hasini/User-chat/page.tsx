'use client'

import { useEffect, useState } from 'react'
import { UserCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid'

type Message = {
  id: number
  sender: 'client' | 'therapist'
  text: string
  time: string
}

export default function ChatPage() {
  const [selectedClient, setSelectedClient] = useState<number | null>(null)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [editMessageId, setEditMessageId] = useState<number | null>(null)

  const therapists = [
    { id: 1, name: 'Dr. Nimal Silva' },
    { id: 2, name: 'Ms. Kavindi Fernando' },
    { id: 3, name: 'Mr. Roshan De Silva' },
    { id: 4, name: 'Dr. Janaki Perera' },
  ]

  const clients = [
    { id: 1, name: 'Chamodi Herath' },
    { id: 2, name: 'Ravindu Madushanka' },
    { id: 3, name: 'Dinithi Jayasekara' },
    { id: 4, name: 'Pasindu Perera' },
  ]

  const fetchMessages = async () => {
    if (!selectedClient) return
    const res = await fetch(`/api/messages?clientId=${selectedClient}`)
    const data = await res.json()
    setChatMessages(data)
  }

  useEffect(() => {
    fetchMessages()
  }, [selectedClient])

  const handleSendMessage = async () => {
    if (!message.trim() || selectedClient === null) return

    if (editMessageId !== null) {
      await fetch('/api/messages', {
        method: 'PUT',
        body: JSON.stringify({
          clientId: selectedClient,
          messageId: editMessageId,
          newText: message,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      setEditMessageId(null)
    } else {
      const now = new Date()
      const time = now.toTimeString().slice(0, 5)

      await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          clientId: selectedClient,
          sender: 'therapist',
          text: message,
          time,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    }

    setMessage('')
    fetchMessages()
  }

  const handleEdit = (msg: Message) => {
    setMessage(msg.text)
    setEditMessageId(msg.id)
  }

  const handleDelete = async (msg: Message) => {
    await fetch(`/api/messages?clientId=${selectedClient}&messageId=${msg.id}`, {
      method: 'DELETE',
    })
    fetchMessages()
  }

  return (
    <div className="flex h-screen bg-gray-100 text-black">
      {/* Sidebar */}
      <div className="w-72 bg-black text-white p-4 border-r border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-red-600">Therapists</h2>
        <ul className="space-y-3">
          {therapists.map(therapist => (
            <li
              key={therapist.id}
              onClick={() => {
                setSelectedClient(therapist.id)
                setMessage('')
                setEditMessageId(null)
              }}
              className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-red-600 transition ${
                selectedClient === therapist.id ? 'bg-red-600' : ''
              }`}
            >
              <UserCircleIcon className="h-8 w-8 text-white" />
              <span className="text-white">{therapist.name}</span>
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
              <div className="relative z-10 space-y-2">
                {chatMessages.map((msg, index) => {
                  const overrideSender =
                    index === 0
                      ? 'therapist'
                      : index === 1
                      ? 'client'
                      : msg.sender

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        overrideSender === 'therapist'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`relative max-w-xs md:max-w-sm px-4 py-2 rounded-2xl shadow-sm ${
                          overrideSender === 'therapist'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-black'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className="text-xs text-right opacity-70 mt-1">{msg.time}</p>

                        {overrideSender === 'therapist' && (
                          <div className="absolute top-0 right-0 bottom-1 flex gap-2 mt-1 mr-2">
                            <PencilIcon
                              className="h-4 w-4 cursor-pointer text-white"
                              onClick={() => handleEdit(msg)}
                            />
                            <TrashIcon
                              className="h-4 w-4 cursor-pointer text-white"
                              onClick={() => handleDelete(msg)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Message Input */}
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
                {editMessageId ? 'Update' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-600 mt-10">Choose a client to begin chatting.</p>
        )}
      </div>
    </div>
  )
}
