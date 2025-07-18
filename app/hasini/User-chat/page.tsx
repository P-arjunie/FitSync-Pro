"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Avatar, AvatarFallback } from "@/Components/ui/avatar"
import { Badge } from "@/Components/ui/badge"
import { Send, UserCheck } from "lucide-react"

type Message = {
  id: string
  senderId: string
  senderName: string
  senderType: "trainer" | "member"
  text: string
  timestamp: Date
  roomId: string
}

type Trainer = {
  id: string
  name: string
  specialty: string
  isOnline: boolean
  lastSeen?: Date
  unreadCount: number
}

export default function MemberChatPage() {
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Current member info (in real app, get from auth)
  const currentMember = {
    id: "member-1",
    name: "John Smith",
    type: "member" as const,
  }

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket("ws://localhost:3001")
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      // Register as member
      ws.send(
        JSON.stringify({
          type: "register",
          userId: currentMember.id,
          userType: "member",
          userName: currentMember.name,
        }),
      )
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case "message":
          setMessages((prev) => [...prev, data.message])
          // Update unread count for the sender
          if (data.message.senderId !== selectedTrainer) {
            setTrainers((prev) =>
              prev.map((trainer) =>
                trainer.id === data.message.senderId ? { ...trainer, unreadCount: trainer.unreadCount + 1 } : trainer,
              ),
            )
          }
          break
        case "trainers_list":
          setTrainers(data.trainers)
          break
        case "user_status":
          setTrainers((prev) =>
            prev.map((trainer) =>
              trainer.id === data.userId
                ? { ...trainer, isOnline: data.isOnline, lastSeen: data.lastSeen ? new Date(data.lastSeen) : undefined }
                : trainer,
            ),
          )
          break
        case "chat_history":
          setMessages(data.messages)
          break
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectTrainer = (trainerId: string) => {
    setSelectedTrainer(trainerId)

    // Mark messages as read
    setTrainers((prev) => prev.map((trainer) => (trainer.id === trainerId ? { ...trainer, unreadCount: 0 } : trainer)))

    // Request chat history
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "get_chat_history",
          roomId: `${trainerId}-${currentMember.id}`,
        }),
      )
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedTrainer || !wsRef.current) return

    const message: Omit<Message, "id"> = {
      senderId: currentMember.id,
      senderName: currentMember.name,
      senderType: "member",
      text: newMessage.trim(),
      timestamp: new Date(),
      roomId: `${selectedTrainer}-${currentMember.id}`,
    }

    wsRef.current.send(
      JSON.stringify({
        type: "send_message",
        message,
        recipientId: selectedTrainer,
      }),
    )

    setNewMessage("")
  }

  const selectedTrainerInfo = trainers.find((t) => t.id === selectedTrainer)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Trainers Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Available Trainers</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {trainers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No trainers available</div>
          ) : (
            <div className="p-2">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  onClick={() => selectTrainer(trainer.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTrainer === trainer.id ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {trainer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        trainer.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{trainer.name}</p>
                      {trainer.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {trainer.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{trainer.specialty}</p>
                    <p className="text-xs text-gray-400">{trainer.isOnline ? "Online" : "Offline"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedTrainerInfo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {selectedTrainerInfo.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedTrainerInfo.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedTrainerInfo.specialty} • {selectedTrainerInfo.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages
                .filter(
                  (msg) =>
                    msg.roomId === `${selectedTrainer}-${currentMember.id}` ||
                    msg.roomId === `${currentMember.id}-${selectedTrainer}`,
                )
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentMember.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.senderId === currentMember.id ? "bg-green-600 text-white" : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === currentMember.id ? "text-green-100" : "text-gray-500"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a trainer to start chatting</h3>
              <p className="text-gray-500">Choose a trainer from the sidebar to begin your conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
