package com.example.smsheadless.data.model

data class Conversation(
    val phone: String,
    val lastMessage: String,
    val timestamp: Long,
    val otpResStatus: String?,
    val otpResMessage: String?
)

