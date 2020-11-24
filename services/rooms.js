import Room from '../schema/rooms.js'

export default class roomService {
    static async getRoom(id) {
        return await Room.findById(id)
            .then(room => {
                return room
            }).catch(error => {
                return error
            })
    }
}