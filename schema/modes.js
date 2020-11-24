import mongoose from 'mongoose';
const { Schema } = mongoose;

const modeSchema = new Schema({
    name: String,
    path: String,
})

export default mongoose.model("modes", modeSchema)