import { Schema, model } from 'mongoose'
import { IChat } from '../../types/chat'

// SharedKey is derived on-the-fly from nacl.box.before(theirPubKey, myPrivKey)
const chatSchema = new Schema<IChat>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        ]
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
)

chatSchema.index({ participants: 1 })

const Chat = model<IChat>('Chat', chatSchema)

export default Chat
