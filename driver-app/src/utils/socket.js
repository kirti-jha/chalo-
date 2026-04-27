import { io } from 'socket.io-client';

const SOCKET_URL = 'http://10.0.2.2:5000';

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;
