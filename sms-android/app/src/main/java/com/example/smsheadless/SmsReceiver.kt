package com.example.smsheadless

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.example.smsheadless.di.SmsServiceLocator
import com.example.smsheadless.util.SmsParsingUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class SmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsReceiver"
        private val receiverScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (
            Telephony.Sms.Intents.SMS_RECEIVED_ACTION == action ||
            Telephony.Sms.Intents.SMS_DELIVER_ACTION == action
        ) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)

            val pendingResult = goAsync()

            receiverScope.launch {
                try {
                    processMessages(context.applicationContext, messages)
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }

    private suspend fun processMessages(
        appContext: Context,
        messages: Array<android.telephony.SmsMessage>
    ) {
        val repository = SmsServiceLocator.provideRepository(appContext)
        val scheduler = SmsServiceLocator.provideScheduler(appContext)

        messages
            .groupBy { "${it.displayOriginatingAddress}-${it.timestampMillis}" }
            .values
            .forEach { parts ->
                val first = parts.firstOrNull() ?: return@forEach
                val from = SmsParsingUtils.normalizePhone(first.displayOriginatingAddress)
                if (from.isBlank()) return@forEach
                val body = parts.joinToString(separator = "") { it.displayMessageBody.orEmpty() }
                if (body.isBlank()) return@forEach

                Log.i(TAG, "[SMS] from=$from | body=$body")

                runCatching {
                    repository.insertIncomingSms(
                        phone = from,
                        message = body,
                        timestamp = first.timestampMillis
                    )
                }.onFailure {
                    Log.e(TAG, "Failed to persist SMS: ${it.message}", it)
                }
            }

        scheduler.enqueueImmediateSync()
    }
}
