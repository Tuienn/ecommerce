package com.example.smsheadless

import android.app.Activity
import android.os.Bundle
import android.util.Log
import android.widget.Toast

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.i("MainActivity", "SmsHeadless app started - BroadcastReceiver is now active")
        Toast.makeText(this, "SMS OTP Service Started", Toast.LENGTH_LONG).show()
        
        // Đóng activity ngay lập tức
        finish()
    }
}
