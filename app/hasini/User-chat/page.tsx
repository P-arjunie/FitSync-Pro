"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Avatar, AvatarFallback } from "@/Components/ui/avatar"
import { Badge } from "@/Components/ui/badge"
import { Send, UserCheck } from "lucide-react"
import { listenToMessages, sendMessage as sendFirestoreMessage, fetchAllTrainers, setUserOnlineStatus } from "@/lib/chatService"

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

function isFirestoreTimestamp(obj: any): obj is { toDate: () => Date } {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.toDate === "function" &&
    Object.prototype.toString.call(obj) !== "[object Date]"
  );
}

function getChatId(trainerId: string, memberId: string) {
  return `${trainerId}-${memberId}`;
}

export default function MemberChatPage() {
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("");

  // Replace currentMember with real user info from Firebase Auth in production
  const currentMember = {
    id: "member-1", // TODO: Replace with real user ID
    name: "John Smith", // TODO: Replace with real user name
    type: "member" as const,
  };

  // Compute recently chatted trainers based on messages
  const recentlyChattedIds = useMemo(() => {
    const ids = Array.from(
      new Set(
        messages
          .map((msg) => {
            // Get the other participant's ID
            if (msg.senderId === currentMember.id) {
              // Sent by member
              return msg.roomId.replace(`${currentMember.id}-`, "").replace(`-${currentMember.id}`, "");
            } else {
              // Received by member
              return msg.senderId;
            }
          })
          .filter((id) => id && id !== currentMember.id)
          .reverse()
      )
    );
    return ids;
  }, [messages, currentMember.id]);

  // Filter and sort trainers
  const filteredTrainers = useMemo(() => {
    return trainers
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [trainers, search]);

  // Recently chatted trainers
  const recentlyChattedTrainers = recentlyChattedIds
    .map((id) => trainers.find((t) => t.id === id))
    .filter(Boolean) as Trainer[];
  const otherTrainers = filteredTrainers.filter((t) => !recentlyChattedIds.includes(t.id));

  useEffect(() => {
    if (!selectedTrainer) return;
    const chatId = getChatId(selectedTrainer, currentMember.id);
    const unsub = listenToMessages(chatId, (msgs) => setMessages(msgs));
    return () => {
      unsub();
    };
  }, [selectedTrainer]);

  useEffect(() => {
    // Fetch trainers from Firestore
    fetchAllTrainers().then(setTrainers);
  }, []);

  useEffect(() => {
    setUserOnlineStatus(currentMember.id, "member", true);
    const handleUnload = () => setUserOnlineStatus(currentMember.id, "member", false);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      setUserOnlineStatus(currentMember.id, "member", false);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectTrainer = (trainerId: string) => {
    setSelectedTrainer(trainerId)

    // Mark messages as read
    setTrainers((prev) => prev.map((trainer) => (trainer.id === trainerId ? { ...trainer, unreadCount: 0 } : trainer)))

    // Request chat history
    // This part is no longer needed as messages are real-time
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTrainer) return;
    const chatId = getChatId(selectedTrainer, currentMember.id);
    await sendFirestoreMessage(
      chatId,
      currentMember.id,
      currentMember.name,
      "member",
      newMessage.trim()
    );
    setNewMessage("");
  };

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
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trainers..."
            className="mt-3"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredTrainers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No trainers available</div>
          ) : (
            <div className="p-2">
              {recentlyChattedTrainers.length > 0 && (
                <>
                  <div className="text-xs text-gray-500 mb-1 ml-1">Recently Chatted</div>
                  {recentlyChattedTrainers.map((trainer) => (
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
                  <div className="border-b border-gray-200 my-2" />
                </>
              )}
              {otherTrainers.map((trainer) => (
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
                        trainer.isOnline ? "bg-green-500" : "bg-gray-400"}
                      `}
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
                    msg.roomId === getChatId(selectedTrainer!, currentMember.id) ||
                    msg.roomId === getChatId(currentMember.id, selectedTrainer!),
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
                        {(() => {
                          let dateObj;
                          if (isFirestoreTimestamp(message.timestamp)) {
                            dateObj = message.timestamp.toDate();
                          } else if (
                            typeof message.timestamp === "string" ||
                            typeof message.timestamp === "number" ||
                            Object.prototype.toString.call(message.timestamp) === "[object Date]"
                          ) {
                            dateObj = new Date(message.timestamp);
                          } else {
                            dateObj = null;
                          }
                          return dateObj
                            ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "—";
                        })()}
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
