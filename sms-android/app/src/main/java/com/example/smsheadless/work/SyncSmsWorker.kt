package com.example.smsheadless.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.smsheadless.data.model.SmsMessage
import com.example.smsheadless.di.SmsServiceLocator
import com.example.smsheadless.network.OtpApiService
import com.example.smsheadless.util.SmsParsingUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SyncSmsWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    private val repository = SmsServiceLocator.provideRepository(appContext)

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val pendingMessages = repository.getPending(MAX_BATCH)
        if (pendingMessages.isEmpty()) {
            return@withContext Result.success()
        }

        val successUpdates = mutableListOf<Pair<Long, String?>>()
        val errorUpdates = mutableListOf<Pair<Long, String>>()
        val skippedIds = mutableListOf<Pair<Long, String>>()

        pendingMessages.forEach { sms ->
            val otp = SmsParsingUtils.extractOtp(sms.message)
            if (otp.isNullOrBlank()) {
                skippedIds.add(sms.id to "No OTP found")
                return@forEach
            }

            val normalizedPhone = SmsParsingUtils.normalizePhone(sms.phone)

            val apiResult = OtpApiService.verifyOtp(normalizedPhone, otp)
            val formattedMessage = formatJson(apiResult.message)
            if (apiResult.isSuccess) {
                successUpdates.add(sms.id to formattedMessage)
            } else {
                errorUpdates.add(sms.id to (formattedMessage ?: "Sync failed"))
            }
        }

        successUpdates
            .groupBy { it.second }
            .forEach { (message, entries) ->
                repository.updateStatus(entries.map { it.first }, STATUS_SUCCESS, message)
            }

        errorUpdates
            .groupBy { it.second }
            .forEach { (message, entries) ->
                repository.updateStatus(entries.map { it.first }, STATUS_ERROR, message)
            }

        skippedIds
            .groupBy { it.second }
            .forEach { (message, entries) ->
                repository.updateStatus(entries.map { it.first }, STATUS_SKIPPED, message)
            }

        Result.success()
    }

    private fun formatJson(jsonStr: String?): String? {
        if (jsonStr.isNullOrBlank()) return jsonStr
        return try {
            if (jsonStr.trim().startsWith("{")) {
                org.json.JSONObject(jsonStr).toString(4)
            } else if (jsonStr.trim().startsWith("[")) {
                org.json.JSONArray(jsonStr).toString(4)
            } else {
                jsonStr
            }
        } catch (e: Exception) {
            jsonStr
        }
    }

    companion object {
        private const val MAX_BATCH = 25
        private const val STATUS_SUCCESS = "success"
        private const val STATUS_ERROR = "error"
        private const val STATUS_SKIPPED = "skipped"
    }
}


