import mongoose from 'mongoose';
const { Schema } = mongoose;

const roomsSchema = new Schema({
    name: {type: String, default: 'untitled'},
    mode: String,
    readonly: {type: Boolean, default: true},
    livemode: {type: Boolean, default: false},
    content: String,
    password: {type: String, default: ''},
    user_id: String,
})

export default mongoose.model("rooms", roomsSchema)