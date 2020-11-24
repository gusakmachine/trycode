import redis from "redis"
import mongoose from "mongoose"
import { v4 as uuidv4 } from 'uuid';
import Room from "../schema/rooms.js";
import RoomsService from "../services/rooms.js";
import ModesService from "../services/modes.js";

export default class liveMode {
    async save(room, room_id) {
        let mongo_room = await RoomsService.getRoom(String(room_id))

        mongo_room.name = room.name

        mongo_room.mode = room.mode
        mongo_room.readonly = room.readonly === 'true'
        mongo_room.livemode = room.livemode === 'true'
        mongo_room.content = room.content
        mongo_room.password = room.password
        mongo_room.user_id = room.user_id

        mongo_room.save()
    }
    async update(data) {
        let room = await RoomsService.getRoom(data.room_id)

        if (!room || room instanceof mongoose.Error) return

        await this.rclient.hmset(String(data.room_id), {
            name: String(room.name),
            mode: String(room.mode),
            readonly: String(room.readonly),
            livemode: String(room.livemode),
            content: String(room.content),
            password: String(room.password),
            user_id: String(room.user_id),
        })

        return room
    }
    async start(io, socket) {
        this.io = io
        this.rclient = redis.createClient()

        socket.on('create-room', async (data) => {
            let modes = await ModesService.getAll()
            let room = new Room({
                mode: modes[0]._id,
                content: data.content,
                user_id: (data.user_id) ? data.user_id : uuidv4(),
                password: data.password,
            })

            await room.save()

            socket.send({
                event: 'room-created',
                room_id: room._id,
                user_id: room.user_id
            })
        })
        socket.on('joining-to-room', (data) => {
            this.rclient.hgetall(String(data.room_id), async (err, room) => {
                if (err || !room) {
                    room = this.update(data)

                    if (!room)
                        return
                }

                if (data.user_id !== room.user_id && (room.password && room.password !== data.password))
                    return socket.send({event:'refused'})

                socket.join(data.room_id)

                if (this.io.sockets.adapter.rooms[data.room_id].length === 1) {
                    socket.send({event: 'actual-content'})
                    console.log('first joined')
                } else {
                    socket.to(data.room_id).emit('join', this.io.sockets.adapter.rooms[data.room_id].length)
                    console.log('other joined')
                }
            })
        })
        socket.on('get-content', (data) => {
            this.rclient.hgetall(String(data.room_id), async (err, room) => {
                if (err || !room)
                    return

                let send_data = {
                    event:'install-content',
                    content: room.content,
                    user_id: (data.user_id) ? data.user_id : uuidv4(),
                    number: this.io.sockets.adapter.rooms[data.room_id].length,
                    synchronized: socket.synchronized = true
                }

                socket.send(send_data)
            })
        })
        socket.on('beforeunload', (room_id) => {
            if (this.io.sockets.adapter.rooms[room_id])
                socket.to(room_id).emit('leave', this.io.sockets.adapter.rooms[room_id].length)
        })
        socket.on('save', (data) => {
            if (!socket.synchronized)
                return

            this.rclient.hgetall(String(data.room_id), async (err, room) => {
                if (err || !room)
                    return

                if (room.readonly === 'false' || data.user_id === room.user_id)
                    await this.save(room, data.room_id)
            })
            console.log('save')
        })
        socket.on('save-content', (data) => {
            if (!socket.synchronized)
                return

            this.rclient.hgetall(String(data.room_id), async (err, room) => {
                if (err || !room)
                    return

                if (room.readonly === 'false' || data.user_id === room.user_id)
                    await this.rclient.hmset(String(data.room_id), {content: String(data.content)})

                this.io.to(data.room_id).emit('actual-content')
                console.log('save-content')
            })
        })
        socket.on('set-password', (data) => {
            this.rclient.hgetall(String(data.room_id), async (err, room) => {
                if (err || !room || room.user_id !== data.user_id)
                    return

                this.rclient.hmset(String(data.room_id), {password: String(data.password)})
                let mongo_room = await RoomsService.getRoom(String(data.room_id))
                mongo_room.password = data.password
                mongo_room.save()
            })
        })
        socket.on('set-mode', (data) => {
            this.rclient.hgetall(String(data.room_id), (err, room) => {
                if (err || !room || room.user_id !== data.user_id)
                    return

                this.rclient.hmset(String(data.room_id), {mode: String(data.mode)})
                this.io.to(data.room_id).emit('set-mode', data.mode)
            })
        })
        socket.on('set-file-name', (data) => {
            this.rclient.hgetall(String(data.room_id), (err, room) => {
                if (err || !room || room.user_id !== data.user_id)
                    return

                this.rclient.hmset(String(data.room_id), {name: String(data.name)})
                this.io.to(data.room_id).emit('set-file-name', data.name)
            })
        })
        socket.on('readonly', (data) => {
            this.rclient.hgetall(String(data.room_id), (err, room) => {
                if (err || !room || room.user_id !== data.user_id)
                    return

                if (room.readonly === 'true') {
                    this.rclient.hmset(String(data.room_id), {readonly: "false"})
                } else this.rclient.hmset(String(data.room_id), {readonly: "true"})
            })
        })
        socket.on('livemode', (data) => {
            this.rclient.hgetall(String(data.room_id), (err, room) => {
                if (err || !room || room.user_id !== data.user_id)
                    return

                if (room.livemode === 'true')
                    this.rclient.hmset(String(data.room_id), {livemode: "false"})
                else this.rclient.hmset(String(data.room_id), {livemode: "true"})
            })
        })

        socket.on('changing-content', async (data) => {
            this.rclient.hgetall(String(data.room_id), (err, room) => {
                if (err || !room)
                    return

                if ((room.readonly === 'false' || data.user_id === room.user_id))
                    if (room.livemode === 'true')
                        socket.to(data.room_id).emit('changing-content', data)
            })
        })
    }
}