package com.example.smsheadless.data.repository

import com.example.smsheadless.data.db.ConversationSummary
import com.example.smsheadless.data.db.SmsDao
import com.example.smsheadless.data.db.SmsEntity
import com.example.smsheadless.data.model.Conversation
import com.example.smsheadless.data.model.SmsMessage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class SmsRepository(
    private val smsDao: SmsDao
) {

    fun observeConversations(): Flow<List<Conversation>> {
        return smsDao.observeConversationSummaries()
            .map { summaries -> summaries.map { it.toConversation() } }
    }

    fun observeMessages(phone: String): Flow<List<SmsMessage>> {
        return smsDao.observeMessages(phone)
            .map { entities -> entities.map { it.toSmsMessage() } }
    }

    suspend fun insertIncomingSms(
        phone: String,
        message: String,
        timestamp: Long,
        otpResStatus: String? = "pending",
        otpResMessage: String? = null
    ): Long {
        val entity = SmsEntity(
            phone = phone,
            message = message,
            timestamp = timestamp,
            otpResStatus = otpResStatus,
            otpResMessage = otpResMessage
        )
        return smsDao.insert(entity)
    }

    suspend fun getPending(limit: Int = 50): List<SmsMessage> {
        return smsDao.getPending(limit).map { it.toSmsMessage() }
    }

    suspend fun updateStatus(ids: List<Long>, status: String?, message: String?) {
        if (ids.isNotEmpty()) {
            smsDao.updateStatus(ids, status, message)
        }
    }

    suspend fun retryFailed(phone: String? = null) {
        smsDao.retryFailed(phone)
    }

    private fun SmsEntity.toSmsMessage(): SmsMessage = SmsMessage(
        id = id,
        phone = phone,
        message = message,
        timestamp = timestamp,
        otpResStatus = otpResStatus,
        otpResMessage = otpResMessage
    )

    private fun ConversationSummary.toConversation(): Conversation = Conversation(
        phone = phone,
        lastMessage = lastMessage,
        timestamp = timestamp,
        otpResStatus = otpResStatus,
        otpResMessage = otpResMessage
    )
}

