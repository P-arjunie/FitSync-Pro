// pages/_app.tsx
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import type { AppProps } from 'next/app';
import { Toaster, toast } from 'react-hot-toast';
import '../styles/globals.css';

interface Notification {
  _id: string;
  message: string;
  createdAt: string;
  [key: string]: any; // fallback for extra fields
}

let socket: Socket;

function MyApp({ Component, pageProps }: AppProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 👉 1. Start backend socket server
  useEffect(() => {
    fetch('/api/socket');
  }, []);

  // 👉 2. Setup socket client
  useEffect(() => {
    socket = io();

    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      socket.emit('join', storedUserId);
      setUserId(storedUserId);
    }

    socket.on('notification', (data: Notification) => {
      console.log('📩 New Notification:', data);
      setNotifications(prev => [data, ...prev]);
      toast.success(data.message); // ✅ Show toast
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 👉 3. Fetch existing notifications
  useEffect(() => {
    if (userId) {
      fetch(`/api/get-notifications?userId=${userId}`)
        .then(res => res.json())
        .then(setNotifications)
        .catch(err => console.error('Fetch error:', err));
    }
  }, [userId]);

  // 👉 4. Render with toast system and pass props
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Component {...pageProps} notifications={notifications ?? []} />
    </>
  );
}

export default MyApp;
