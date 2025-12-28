package com.example.smsheadless.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [SmsEntity::class],
    version = 1,
    exportSchema = false
)
abstract class SmsDatabase : RoomDatabase() {

    abstract fun smsDao(): SmsDao

    companion object {
        @Volatile
        private var instance: SmsDatabase? = null

        fun getInstance(context: Context): SmsDatabase =
            instance ?: synchronized(this) {
                instance ?: buildDatabase(context).also { instance = it }
            }

        private fun buildDatabase(context: Context): SmsDatabase {
            return Room.databaseBuilder(
                context.applicationContext,
                SmsDatabase::class.java,
                "sms.db"
            ).fallbackToDestructiveMigration()
                .build()
        }
    }
}

