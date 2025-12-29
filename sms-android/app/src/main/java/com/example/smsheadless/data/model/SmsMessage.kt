package com.example.smsheadless.data.model

data class SmsMessage(
    val id: Long,
    val phone: String,
    val message: String,
    val timestamp: Long,
    val otpResStatus: String?,
    val otpResMessage: String?
)

