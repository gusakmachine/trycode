import socketio from 'socket.io'
import LiveMode from './live-mode.js'

export default async (server) => {
    const io = socketio(server)
    let livemode = new LiveMode()

    io.on('connection', socket => {
        socket.synchronized = false

        livemode.start(io, socket)
    })

    return io
}