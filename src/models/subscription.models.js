import mongoose, { Schema } from "mongoose";

const subscriptionShema = Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,// one to whom 'subscriber' is subscribing
        ref: "User"
    }
}, {
    timestapms: true
})

export const Subscription = mongoose.model("Subscription", subscriptionShema)