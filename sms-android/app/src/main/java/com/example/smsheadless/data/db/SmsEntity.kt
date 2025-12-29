package com.example.smsheadless.data.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "sms",
    indices = [
        Index(value = ["phone"]),
        Index(value = ["timestamp"]),
        Index(value = ["phone", "timestamp"])
    ]
)
data class SmsEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val phone: String,
    val message: String,
    val timestamp: Long,
    @ColumnInfo(defaultValue = "'pending'")
    val otpResStatus: String? = "pending",
    val otpResMessage: String? = null
)

