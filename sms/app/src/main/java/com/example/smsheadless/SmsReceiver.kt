package com.example.smsheadless

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern

class SmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsReceiver"
        private const val API_URL = "https://api.app.uytinmang.vn/v1/api/extension/otp/verify"
        private val OTP_PATTERN = Pattern.compile("OTP\\D*(\\d+)", Pattern.CASE_INSENSITIVE)
        
     
        private fun formatPhoneNumber(phone: String): String {
            return when {
                phone.startsWith("+84") -> "0" + phone.substring(3)
                phone.startsWith("84") && phone.length >= 10 -> "0" + phone.substring(2)
                else -> phone // Giữ nguyên nếu không match pattern
            }
        }

        // ✅ Singleton OkHttpClient với connection pooling
        private val httpClient: OkHttpClient by lazy {
            OkHttpClient.Builder()
                .connectTimeout(5, TimeUnit.SECONDS)
                .writeTimeout(5, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .connectionPool(ConnectionPool(10, 5, TimeUnit.MINUTES))
                .retryOnConnectionFailure(true)
                .build()
        }

        // ✅ Scope cho background processing
        private val processingScope = CoroutineScope(
            Dispatchers.IO + SupervisorJob()
        )
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION == intent.action) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)

            // ✅ Dùng goAsync để giữ BroadcastReceiver sống cho đến khi coroutine xong
            val pendingResult = goAsync()

            processingScope.launch {
                try {
                    processMessages(messages)
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }

    private suspend fun processMessages(messages: Array<android.telephony.SmsMessage>) {
        for (msg in messages) {
            val from = msg.displayOriginatingAddress
            val body = msg.displayMessageBody

            Log.i(TAG, "[SMS] from=$from | body=$body")

            checkAndSendOtp(from, body)
        }
    }

    private fun checkAndSendOtp(phone: String, messageBody: String) {
        val matcher = OTP_PATTERN.matcher(messageBody)
        if (matcher.find()) {
            val otp = matcher.group(1)
            Log.i(TAG, "OTP detected: $otp from phone: $phone")

            processingScope.launch {
                sendOtpToApi(phone, otp)
            }
        } else {
            Log.d(TAG, "No OTP found in message: $messageBody")
        }
    }

    private suspend fun sendOtpToApi(phone: String, otp: String) {
        try {
            // Format số điện thoại trước khi gửi
            val formattedPhone = formatPhoneNumber(phone)
            Log.i(TAG, "Phone format: $phone -> $formattedPhone")
            
            val jsonBody = JSONObject().apply {
                put("phone", formattedPhone)
                put("code", otp)
                put("timestamp", System.currentTimeMillis())
            }

            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = jsonBody.toString().toRequestBody(mediaType)

            val request = Request.Builder()
                .url(API_URL)
                .post(requestBody)
                .build()

            val response = withContext(Dispatchers.IO) {
                httpClient.newCall(request).execute()
            }

            response.use {
                if (response.isSuccessful) {
                    Log.i(TAG, "✅ OTP sent successfully: phone=${formatPhoneNumber(phone)}, otp=$otp")
                } else {
                    Log.e(TAG, "❌ API error: ${response.code} - ${response.message}")
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to send OTP: ${e.message}", e)
        }
    }
}
