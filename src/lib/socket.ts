import { io } from "socket.io-client"

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ""
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN || ""

export const ds2Socket = io(`${SOCKET_URL}/ds2`, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  query: AUTH_TOKEN ? { auth: AUTH_TOKEN } : {},
})
