// pages/api/socket.js
import { Server } from 'socket.io';

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', socket => {
      console.log('User connected:', socket.id);

      socket.on('join', userId => {
        socket.join(userId); // Join room for that user
      });
    });
  }
  res.end();
}
