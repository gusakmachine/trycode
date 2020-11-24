import Mode from '../schema/modes.js';

export default class MoodService {
    static async getAll() {
        return await Mode.find({})
            .then(modes => {
                return modes
            }).catch(error => {
                return error
            })
    }
    static async getMood(id) {
        return await Mode.findById(id)
            .then(modes => {
                return modes
            }).catch(error => {
                return error
            })
    }
}