"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Avatar, AvatarFallback } from "@/Components/ui/avatar"
import { Badge } from "@/Components/ui/badge"
import { Send, Users, Trash2 } from "lucide-react"
import { listenToMessages, sendMessage as sendFirestoreMessage, fetchAllMembers, setUserOnlineStatus, deleteMessage, editMessage, deleteAllMessages } from "@/lib/chatService"
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const currentTrainer = {
    id: "trainer-1",
    name: "Trainer John",
    type: "trainer" as const,
  };
  const [userDetails, setUserDetails] = useState<any>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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
    if (!currentTrainer.id) return;
    const ref = doc(db, "trainers", currentTrainer.id);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setUserDetails(snap.data());
    });
  }, [currentTrainer.id]);

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
          {userDetails && (
            <div className="mb-4 p-3 rounded" style={{ background: '#e53935' }}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-lg">{userDetails.name}</span>
                <span className="flex items-center gap-1">
                  <span className={`inline-block w-3 h-3 rounded-full border-2 border-white ${userDetails.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className="text-xs text-white">{userDetails.isOnline ? 'Online' : 'Offline'}</span>
                </span>
              </div>
              {userDetails.specialty && (
                <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {userDetails.specialty}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5" style={{ color: '#e53935' }} />
            <h2 className="text-lg font-semibold text-gray-900">My Members</h2>
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
                          <AvatarFallback className="bg-red-600 text-white font-bold">
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
                      <AvatarFallback className="bg-red-600 text-white font-bold">
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
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-red-600 text-white font-bold">
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
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedMember(null)} className="text-red-600 text-xl font-bold px-2 hover:bg-red-100 rounded">×</button>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
                      await deleteAllMessages(getChatId(currentTrainer.id, selectedMember!));
                    }
                  }}
                  className="text-red-600 text-xl font-bold px-2 hover:bg-red-100 rounded"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages
                .filter((msg) => selectedMember && msg.roomId === getChatId(currentTrainer.id, selectedMember))
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentTrainer.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative group ${
                        message.senderId === currentTrainer.id ? "bg-red-600 text-white" : "bg-[#e0e0e0] text-gray-900"
                      }`}
                    >
                      {editingMessageId === message.id ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await editMessage(getChatId(currentTrainer.id, selectedMember!), message.id, editText);
                            setEditingMessageId(null);
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            className="flex-1 px-2 py-1 rounded text-black"
                            autoFocus
                          />
                          <button type="submit" className="text-xs text-white font-bold">Save</button>
                          <button type="button" onClick={() => setEditingMessageId(null)} className="text-xs text-white">Cancel</button>
                        </form>
                      ) : (
                        <>
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs mt-1">
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
                          {message.senderId === currentTrainer.id && (
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setEditingMessageId(message.id);
                                  setEditText(message.text);
                                }}
                                className="text-xs text-white bg-black/30 rounded px-1"
                                title="Edit"
                              >✎</button>
                              <button
                                onClick={async () => {
                                  await deleteMessage(getChatId(currentTrainer.id, selectedMember!), message.id);
                                }}
                                className="text-xs text-white bg-black/30 rounded px-1"
                                title="Delete"
                              >🗑</button>
                            </div>
                          )}
                        </>
                      )}
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
              <Users className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to FitSync Chat</h3>
              <p className="text-gray-500">Select a member from the sidebar to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
