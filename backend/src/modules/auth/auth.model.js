const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    refreshTokenUsed: {
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 30 * 24 * 60 * 60
    }
})

tokenSchema.index({ expireAfterSeconds: 30 * 24 * 60 * 60 })

const Token = mongoose.model('Token', tokenSchema)

module.exports = Token
