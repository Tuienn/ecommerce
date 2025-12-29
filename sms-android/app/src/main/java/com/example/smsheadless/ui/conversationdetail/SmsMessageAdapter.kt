package com.example.smsheadless.ui.conversationdetail

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.smsheadless.R
import com.example.smsheadless.data.model.SmsMessage
import com.example.smsheadless.databinding.ItemMessageBinding
import com.example.smsheadless.util.TimeFormatter

class SmsMessageAdapter : ListAdapter<SmsMessage, SmsMessageAdapter.MessageViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val binding = ItemMessageBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return MessageViewHolder(binding)
    }

    override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class MessageViewHolder(
        private val binding: ItemMessageBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(message: SmsMessage) {
            binding.bodyTextView.text = message.message
            binding.timestampTextView.text = TimeFormatter.format(message.timestamp)
            val status = message.otpResStatus ?: binding.root.context.getString(R.string.status_pending)
            binding.statusTextView.text = status
            val colorRes = when (message.otpResStatus) {
                "success" -> android.R.color.holo_green_dark
                "error" -> android.R.color.holo_red_dark
                "skipped" -> android.R.color.darker_gray
                else -> android.R.color.holo_orange_dark
            }
            binding.statusTextView.setTextColor(
                ContextCompat.getColor(binding.root.context, colorRes)
            )
            binding.statusMessageTextView.text = message.otpResMessage.orEmpty()
        }
    }

    private object DiffCallback : DiffUtil.ItemCallback<SmsMessage>() {
        override fun areItemsTheSame(oldItem: SmsMessage, newItem: SmsMessage): Boolean =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: SmsMessage, newItem: SmsMessage): Boolean =
            oldItem == newItem
    }
}


