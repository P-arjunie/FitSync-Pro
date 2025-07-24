"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Avatar, AvatarFallback } from "@/Components/ui/avatar"
import { Badge } from "@/Components/ui/badge"
import { Send, UserCheck, Trash2, Users } from "lucide-react"
import { listenToMessages, sendMessage as sendFirestoreMessage, fetchAllTrainers, setUserOnlineStatus, deleteMessage, editMessage, deleteAllMessages, listenToTrainersOnlineStatus } from "@/lib/chatService"
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSearchParams } from 'next/navigation';
import FloatingChatButton from "@/Components/ui/FloatingChatButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

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
  const searchParams = useSearchParams();
  const trainerIdFromQuery = searchParams.get('trainerId');
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("");
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const currentMember = {
    id: "member-1",
    name: "Member Smith",
    type: "member" as const,
  };
  const [userDetails, setUserDetails] = useState<any>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (!selectedTrainer) return;
    const chatId = getChatId(selectedTrainer, currentMember.id);
    const unsub = listenToMessages(chatId, (msgs) => setMessages(msgs));
    return () => {
      unsub();
    };
  }, [selectedTrainer]);

  useEffect(() => {
    if (!selectedTrainer) return;
    const ref = doc(db, "members", currentMember.id);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setUserDetails(snap.data());
    });
  }, [selectedTrainer]);

  useEffect(() => {
    if (trainerIdFromQuery && trainers.length > 0) {
      // If trainerId is present in the URL and trainers are loaded, auto-select
      setSelectedTrainer(trainerIdFromQuery);
    }
  }, [trainerIdFromQuery, trainers]);

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

  // Filter for modal
  const allPeople = [...trainers]; // Add members here if you want both
  const filteredModalPeople = allPeople.filter(p => p.name.toLowerCase().includes(modalSearch.toLowerCase()));

  // Recently chatted trainers
  const recentlyChattedTrainers = recentlyChattedIds
    .map((id) => trainers.find((t) => t.id === id))
    .filter(Boolean) as Trainer[];
  const otherTrainers = filteredTrainers.filter((t) => !recentlyChattedIds.includes(t.id));

  useEffect(() => {
    // Fetch trainers from Firestore in real time
    const unsub = listenToTrainersOnlineStatus(setTrainers);
    return () => unsub();
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

  // Compute if any unread messages exist
  const hasUnread = trainers.some(t => t.unreadCount > 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <FloatingChatButton hasUnread={hasUnread} />
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          {(userDetails || currentMember) && (
            <div className="mb-4 p-3 rounded" style={{ background: '#e53935' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-red-600 text-white font-bold">
                      {(userDetails?.name || currentMember.name).split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-white text-lg">{userDetails?.name || currentMember.name}</span>
                </div>
                <span className="flex items-center gap-1">
                  <span className={`inline-block w-3 h-3 rounded-full border-2 border-white ${(userDetails?.isOnline ?? true) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className="text-xs text-white">{(userDetails?.isOnline ?? true) ? 'Online' : 'Offline'}</span>
                </span>
              </div>
              {userDetails?.specialty && (
                <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {userDetails.specialty}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-5 w-5" style={{ color: '#e53935' }} />
            <h2 className="text-lg font-semibold text-gray-900">Available Trainers</h2>
            <button onClick={() => setShowAllModal(true)} className="ml-auto p-1 rounded hover:bg-gray-200" title="Show All Trainers and Members">
              <Users className="w-5 h-5 text-red-600" />
            </button>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trainers..."
            className="mt-3"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* New Messages Section */}
          {trainers.some(t => t.unreadCount > 0) && (
            <>
              <div className="text-xs text-red-600 mb-1 ml-1 font-bold">New Messages</div>
              {trainers.filter(t => t.unreadCount > 0).map(trainer => (
                <div
                  key={trainer.id}
                  onClick={() => selectTrainer(trainer.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedTrainer === trainer.id ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"}`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-red-600 text-white font-bold">
                        {trainer.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {/* Unread badge */}
                    {trainer.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 flex items-center justify-center border-2 border-white shadow" style={{ minWidth: 18, minHeight: 18, fontWeight: 700 }}>
                        {trainer.unreadCount > 9 ? '9+' : trainer.unreadCount}
                      </span>
                    )}
                    {/* Online/offline dot */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        trainer.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{trainer.name}</p>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{trainer.specialty}</p>
                    <p className="text-xs text-gray-400">{trainer.isOnline ? "Online" : "Offline"}</p>
                  </div>
                </div>
              ))}
              <div className="border-b border-gray-200 my-2" />
            </>
          )}
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
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedTrainer === trainer.id ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"}`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-red-600 text-white font-bold">
                            {trainer.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                        {/* Unread badge */}
                        {trainer.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 flex items-center justify-center border-2 border-white shadow" style={{ minWidth: 18, minHeight: 18, fontWeight: 700 }}>
                            {trainer.unreadCount > 9 ? '9+' : trainer.unreadCount}
                          </span>
                        )}
                        {/* Online/offline dot */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        trainer.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">{trainer.name}</p>
                          {/* Optionally, show badge here too */}
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
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedTrainer === trainer.id ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"}`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-red-600 text-white font-bold">
                        {trainer.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {/* Unread badge */}
                    {trainer.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 flex items-center justify-center border-2 border-white shadow" style={{ minWidth: 18, minHeight: 18, fontWeight: 700 }}>
                        {trainer.unreadCount > 9 ? '9+' : trainer.unreadCount}
                      </span>
                    )}
                    {/* Online/offline dot */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        trainer.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{trainer.name}</p>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{trainer.specialty}</p>
                    <p className="text-xs text-gray-400">{trainer.isOnline ? "Online" : "Offline"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Show All Modal */}
        <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>All Trainers and Members</DialogTitle>
            </DialogHeader>
            <Input
              value={modalSearch}
              onChange={e => setModalSearch(e.target.value)}
              placeholder="Search all..."
              className="mb-4"
            />
            <div className="max-h-96 overflow-y-auto">
              {filteredModalPeople.map(person => (
                <div key={person.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-red-600 text-white font-bold">
                      {person.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900">{person.name}</span>
                  <span className={`ml-auto w-2 h-2 rounded-full ${person.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedTrainerInfo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-red-600 text-white font-bold">
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
              <div className="flex items-center gap-2">
              <button onClick={() => setSelectedTrainer(null)} className="text-red-600 text-xl font-bold px-2 hover:bg-red-100 rounded">×</button>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
                      await deleteAllMessages(getChatId(selectedTrainer!, currentMember.id));
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
                .filter((msg) => selectedTrainer && msg.roomId === getChatId(selectedTrainer, currentMember.id))
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentMember.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative group ${
                        message.senderId === currentMember.id ? "bg-red-600 text-white" : "bg-[#e0e0e0] text-gray-900"
                      }`}
                    >
                      {editingMessageId === message.id ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await editMessage(getChatId(selectedTrainer!, currentMember.id), message.id, editText);
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
                          {message.senderId === currentMember.id && (
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
                                  await deleteMessage(getChatId(selectedTrainer!, currentMember.id), message.id);
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
              <UserCheck className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to FitSync Chat</h3>
              <p className="text-gray-500">Select a trainer from the sidebar to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
