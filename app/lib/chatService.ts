import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// Listen to messages in real-time for a chat room
export function listenToMessages(chatId: string, callback: (messages: any[]) => void) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
}

// Send a new message to a chat room
export async function sendMessage(chatId: string, senderId: string, senderName: string, senderType: string, text: string) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId,
    senderName,
    senderType,
    text,
    timestamp: serverTimestamp(),
    roomId: chatId,
  });
}

export async function fetchAllTrainers() {
  const trainersRef = collection(db, "trainers");
  const snapshot = await getDocs(trainersRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || "Unknown Trainer",
      specialty: data.specialty || "General",
      isOnline: typeof data.isOnline === "boolean" ? data.isOnline : false,
      unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 0,
    };
  });
}

export async function fetchAllMembers() {
  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || "Unknown Member",
      isOnline: typeof data.isOnline === "boolean" ? data.isOnline : false,
      unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 0,
    };
  });
}

export async function fetchUserChatRooms(userId: string) {
  const chatsRef = collection(db, "chats");
  const snapshot = await getDocs(chatsRef);
  // Return chat room IDs where userId is part of the document ID
  return snapshot.docs
    .map(doc => doc.id)
    .filter(id => id.includes(userId));
}

export async function setUserOnlineStatus(userId: string, role: "member" | "trainer", isOnline: boolean) {
  const ref = doc(db, role === "trainer" ? "trainers" : "members", userId);
  await updateDoc(ref, { isOnline });
} 