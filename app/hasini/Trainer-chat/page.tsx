"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Avatar, AvatarFallback } from "@/Components/ui/avatar"
import { Badge } from "@/Components/ui/badge"
import { Send, Users } from "lucide-react"
import { listenToMessages, sendMessage as sendFirestoreMessage, fetchAllMembers, setUserOnlineStatus } from "@/lib/chatService"

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

export default function TrainerChatPage() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("");

  // Replace currentTrainer with real user info from Firebase Auth in production
  const currentTrainer = {
    id: "trainer-1", // TODO: Replace with real user ID
    name: "Dr. Sarah Johnson", // TODO: Replace with real user name
    type: "trainer" as const,
  };

  useEffect(() => {
    if (!selectedMember) return;
    const chatId = getChatId(currentTrainer.id, selectedMember);
    const unsub = listenToMessages(chatId, (msgs) => setMessages(msgs));
    return () => {
      unsub();
    };
  }, [selectedMember]);

  useEffect(() => {
    // Fetch members from Firestore
    fetchAllMembers().then(setMembers);
  }, []);

  useEffect(() => {
    setUserOnlineStatus(currentTrainer.id, "trainer", true);
    const handleUnload = () => setUserOnlineStatus(currentTrainer.id, "trainer", false);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      setUserOnlineStatus(currentTrainer.id, "trainer", false);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectMember = (memberId: string) => {
    setSelectedMember(memberId)

    // Mark messages as read
    // This logic needs to be adapted for Firestore, as there's no direct unreadCount in messages
    // For now, we'll just clear messages for the selected member if it's the current one
    if (memberId === currentTrainer.id) {
      setMessages([]);
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMember) return;
    const chatId = getChatId(currentTrainer.id, selectedMember);
    await sendFirestoreMessage(
      chatId,
      currentTrainer.id,
      currentTrainer.name,
      "trainer",
      newMessage.trim()
    );
    setNewMessage("");
  };

  const selectedMemberInfo = members.find((m) => m.id === selectedMember)

  // Compute recently chatted members based on messages
  const recentlyChattedIds = useMemo(() => {
    const ids = Array.from(
      new Set(
        messages
          .map((msg) => {
            // Get the other participant's ID
            if (msg.senderId === currentTrainer.id) {
              // Sent by trainer
              return msg.roomId.replace(`${currentTrainer.id}-`, "").replace(`-${currentTrainer.id}`, "");
            } else {
              // Received by trainer
              return msg.senderId;
            }
          })
          .filter((id) => id && id !== currentTrainer.id)
          .reverse()
      )
    );
    return ids;
  }, [messages, currentTrainer.id]);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, search]);

  // Recently chatted members
  const recentlyChattedMembers = recentlyChattedIds
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean) as Member[];
  const otherMembers = filteredMembers.filter((m) => !recentlyChattedIds.includes(m.id));

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
            <span className="text-sm text-gray-600">Firestore Chat</span>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="mt-3"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredMembers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No members available</div>
          ) : (
            <div className="p-2">
              {recentlyChattedMembers.length > 0 && (
                <>
                  <div className="text-xs text-gray-500 mb-1 ml-1">Recently Chatted</div>
                  {recentlyChattedMembers.map((member) => (
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
                        </div>
                        <p className="text-sm text-gray-500">{member.isOnline ? "Online" : "Offline"}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-b border-gray-200 my-2" />
                </>
              )}
              {otherMembers.map((member) => (
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
