package com.example.smsheadless.util

import java.util.Locale
import java.util.regex.Pattern

object SmsParsingUtils {

    private val otpPatterns = listOf(
        Pattern.compile("OTP\\D*(\\d{4,8})", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(\\d{6})\\b")
    )

    fun normalizePhone(phone: String?): String {
        if (phone.isNullOrBlank()) return ""
        val sanitized = phone.trim()
        return when {
            sanitized.startsWith("+84") && sanitized.length > 3 -> "0" + sanitized.substring(3)
            sanitized.startsWith("84") && sanitized.length > 2 -> "0" + sanitized.substring(2)
            sanitized.startsWith("0") -> sanitized
            else -> sanitized.lowercase(Locale.getDefault())
        }
    }

    fun extractOtp(message: String?): String? {
        if (message.isNullOrBlank()) return null
        for (pattern in otpPatterns) {
            val matcher = pattern.matcher(message)
            if (matcher.find()) {
                return matcher.group(1)
            }
        }
        return null
    }
}


