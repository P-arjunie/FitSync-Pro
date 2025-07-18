"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Avatar, AvatarFallback } from "@/Components/ui/avatar"
import { Badge } from "@/Components/ui/badge"
import { Send, Users } from "lucide-react"

type Message = {
  id: string
  senderId: string
  senderName: string
  senderType: "trainer" | "member"
  text: string
  timestamp: Date
  roomId: string
}

type Member = {
  id: string
  name: string
  isOnline: boolean
  lastSeen?: Date
  unreadCount: number
}

export default function TrainerChatPage() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Current trainer info (in real app, get from auth)
  const currentTrainer = {
    id: "trainer-1",
    name: "Dr. Sarah Johnson",
    type: "trainer" as const,
  }

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket("ws://localhost:3001")
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      // Register as trainer
      ws.send(
        JSON.stringify({
          type: "register",
          userId: currentTrainer.id,
          userType: "trainer",
          userName: currentTrainer.name,
        }),
      )
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case "message":
          setMessages((prev) => [...prev, data.message])
          // Update unread count for the sender
          if (data.message.senderId !== selectedMember) {
            setMembers((prev) =>
              prev.map((member) =>
                member.id === data.message.senderId ? { ...member, unreadCount: member.unreadCount + 1 } : member,
              ),
            )
          }
          break
        case "members_list":
          setMembers(data.members)
          break
        case "user_status":
          setMembers((prev) =>
            prev.map((member) =>
              member.id === data.userId
                ? { ...member, isOnline: data.isOnline, lastSeen: data.lastSeen ? new Date(data.lastSeen) : undefined }
                : member,
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

  const selectMember = (memberId: string) => {
    setSelectedMember(memberId)

    // Mark messages as read
    setMembers((prev) => prev.map((member) => (member.id === memberId ? { ...member, unreadCount: 0 } : member)))

    // Request chat history
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "get_chat_history",
          roomId: `${currentTrainer.id}-${memberId}`,
        }),
      )
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedMember || !wsRef.current) return

    const message: Omit<Message, "id"> = {
      senderId: currentTrainer.id,
      senderName: currentTrainer.name,
      senderType: "trainer",
      text: newMessage.trim(),
      timestamp: new Date(),
      roomId: `${currentTrainer.id}-${selectedMember}`,
    }

    wsRef.current.send(
      JSON.stringify({
        type: "send_message",
        message,
        recipientId: selectedMember,
      }),
    )

    setNewMessage("")
  }

  const selectedMemberInfo = members.find((m) => m.id === selectedMember)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Members Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">My Members</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {members.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No members available</div>
          ) : (
            <div className="p-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => selectMember(member.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedMember === member.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        member.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{member.name}</p>
                      {member.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {member.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.isOnline ? "Online" : "Offline"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedMemberInfo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedMemberInfo.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedMemberInfo.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMemberInfo.isOnline ? "Online" : "Offline"}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages
                .filter(
                  (msg) =>
                    msg.roomId === `${currentTrainer.id}-${selectedMember}` ||
                    msg.roomId === `${selectedMember}-${currentTrainer.id}`,
                )
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentTrainer.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.senderId === currentTrainer.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === currentTrainer.id ? "text-blue-100" : "text-gray-500"
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
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a member to start chatting</h3>
              <p className="text-gray-500">Choose a member from the sidebar to begin your conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
