import type { Server } from "socket.io"
import { ds2Buffer } from "../store/ds2-buffer.js"
import { config } from "../config.js"

export function setupDS2Stream(io: Server) {
  const ds2Namespace = io.of("/ds2")

  ds2Namespace.use((socket, next) => {
    if (!config.authToken || socket.handshake.query.auth === config.authToken) {
      return next()
    }
    next(new Error("forbidden"))
  })

  ds2Buffer.on("entries", (entries) => {
    ds2Namespace.emit("ds2:logs", entries)
  })

  ds2Namespace.on("connection", (socket) => {
    console.log(`[DS2 Socket] Client connected: ${socket.id}`)
    socket.emit("ds2:initial", ds2Buffer.getRecent(200))

    socket.on("disconnect", () => {
      console.log(`[DS2 Socket] Client disconnected: ${socket.id}`)
    })
  })
}
