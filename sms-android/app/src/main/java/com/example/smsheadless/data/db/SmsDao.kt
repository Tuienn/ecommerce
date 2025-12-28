package com.example.smsheadless.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface SmsDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: SmsEntity): Long

    @Query(
        """
        SELECT s.phone AS phone,
               s.message AS lastMessage,
               s.timestamp AS timestamp,
               s.otpResStatus AS otpResStatus,
               s.otpResMessage AS otpResMessage
        FROM sms s
        INNER JOIN (
            SELECT phone, MAX(timestamp) AS latestTimestamp
            FROM sms
            GROUP BY phone
        ) grouped ON s.phone = grouped.phone AND s.timestamp = grouped.latestTimestamp
        ORDER BY s.timestamp DESC
        """
    )
    fun observeConversationSummaries(): Flow<List<ConversationSummary>>

    @Query("SELECT * FROM sms WHERE phone = :phone ORDER BY timestamp DESC")
    fun observeMessages(phone: String): Flow<List<SmsEntity>>

    @Query(
        """
        SELECT * FROM sms
        WHERE otpResStatus IS NULL OR otpResStatus IN ('pending', 'error')
        ORDER BY timestamp ASC
        LIMIT :limit
        """
    )
    suspend fun getPending(limit: Int = 50): List<SmsEntity>

    @Query(
        "UPDATE sms SET otpResStatus = :status, otpResMessage = :message WHERE id IN (:ids)"
    )
    suspend fun updateStatus(ids: List<Long>, status: String?, message: String?)

    @Query(
        """
        UPDATE sms
        SET otpResStatus = 'pending', otpResMessage = NULL
        WHERE otpResStatus = 'error' AND (:phone IS NULL OR phone = :phone)
        """
    )
    suspend fun retryFailed(phone: String? = null)
}

data class ConversationSummary(
    val phone: String,
    val lastMessage: String,
    val timestamp: Long,
    val otpResStatus: String?,
    val otpResMessage: String?
)

