package com.example.smsheadless.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.ConnectionPool
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object OtpApiService {

    private const val API_URL =
        "https://ecommerce-backend-latest-vms1.onrender.com/v1/api/auth/otp/verify/phone"

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .writeTimeout(5, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .connectionPool(ConnectionPool(8, 5, TimeUnit.MINUTES))
            .retryOnConnectionFailure(true)
            .build()
    }

    suspend fun verifyOtp(phone: String, code: String): ApiResult {
        val payload = JSONObject().apply {
            put("phone", phone)
            put("code", code)
            put("timestamp", System.currentTimeMillis())
        }

        val request = Request.Builder()
            .url(API_URL)
            .post(payload.toString().toRequestBody(jsonMediaType))
            .build()

        return withContext(Dispatchers.IO) {
            runCatching {
                client.newCall(request).execute().use { response ->
                    val body = response.body?.string().orEmpty()
                    if (response.isSuccessful) {
                        ApiResult(true, body.ifBlank { "OTP synced" })
                    } else {
                        ApiResult(false, body.ifBlank { "API error ${response.code}" })
                    }
                }
            }.getOrElse { throwable ->
                ApiResult(false, throwable.message ?: "Unknown error")
            }
        }
    }

    data class ApiResult(
        val isSuccess: Boolean,
        val message: String?
    )
}


