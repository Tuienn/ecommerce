package com.example.smsheadless.di

import android.content.Context
import com.example.smsheadless.data.db.SmsDatabase
import com.example.smsheadless.data.repository.SmsRepository
import com.example.smsheadless.work.SmsSyncScheduler

object SmsServiceLocator {

    @Volatile
    private var repository: SmsRepository? = null

    @Volatile
    private var scheduler: SmsSyncScheduler? = null

    fun provideRepository(context: Context): SmsRepository {
        return repository ?: synchronized(this) {
            repository ?: buildRepository(context.applicationContext).also { repository = it }
        }
    }

    fun provideScheduler(context: Context): SmsSyncScheduler {
        return scheduler ?: synchronized(this) {
            scheduler ?: SmsSyncScheduler(context.applicationContext).also { scheduler = it }
        }
    }

    private fun buildRepository(context: Context): SmsRepository {
        val db = SmsDatabase.getInstance(context)
        return SmsRepository(db.smsDao())
    }
}


