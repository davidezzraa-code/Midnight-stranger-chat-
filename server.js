const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

let waitingQueue = [];
const activeMatches = new Map();

io.on('connection', (socket) => {
    console.log(`User entered Midnight Chat: ${socket.id}`);

    const handleDisconnectOrSkip = (currentSocket) => {
        const partnerId = activeMatches.get(currentSocket.id);
        
        if (partnerId) {
            const partnerSocket = io.sockets.sockets.get(partnerId);
            if (partnerSocket) {
                partnerSocket.emit('partnerDisconnected');
                activeMatches.delete(partnerId);
            }
            activeMatches.delete(currentSocket.id);
        }
        waitingQueue = waitingQueue.filter(id => id !== currentSocket.id);
    };

    socket.on('findMatch', () => {
        handleDisconnectOrSkip(socket);

        if (waitingQueue.length > 0) {
            const partnerId = waitingQueue.shift();
            const partnerSocket = io.sockets.sockets.get(partnerId);

            if (partnerSocket && partnerId !== socket.id) {
                activeMatches.set(socket.id, partnerId);
                activeMatches.set(partnerId, socket.id);

                socket.emit('matched');
                partnerSocket.emit('matched');
            } else {
                waitingQueue.push(socket.id);
                socket.emit('waiting');
            }
        } else {
            waitingQueue.push(socket.id);
            socket.emit('waiting');
        }
    });

    socket.on('sendMessage', (message) => {
        const partnerId = activeMatches.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit('receiveMessage', message);
        }
    });

    socket.on('typing', (isTyping) => {
        const partnerId = activeMatches.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit('partnerTyping', isTyping);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User left Midnight Chat: ${socket.id}`);
        handleDisconnectOrSkip(socket);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Midnight Stranger Chat server running on port ${PORT}`);
});
