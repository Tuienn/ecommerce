package com.example.smsheadless.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object TimeFormatter {
    private val dateFormat = SimpleDateFormat("dd/MM HH:mm", Locale.getDefault())

    fun format(timestamp: Long): String = synchronized(dateFormat) {
        dateFormat.format(Date(timestamp))
    }
}


