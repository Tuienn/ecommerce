package com.example.smsheadless.ui.conversationlist

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.smsheadless.data.model.Conversation
import com.example.smsheadless.R
import com.example.smsheadless.databinding.ItemConversationBinding
import com.example.smsheadless.util.TimeFormatter

class ConversationAdapter(
    private val onConversationClicked: (Conversation) -> Unit
) : ListAdapter<Conversation, ConversationAdapter.ConversationViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ConversationViewHolder {
        val binding = ItemConversationBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ConversationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ConversationViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ConversationViewHolder(
        private val binding: ItemConversationBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(conversation: Conversation) {
            binding.phoneTextView.text = conversation.phone
            binding.previewTextView.text = conversation.lastMessage
            binding.timestampTextView.text = TimeFormatter.format(conversation.timestamp)
            val status = conversation.otpResStatus ?: binding.root.context.getString(R.string.status_pending)
            binding.statusTextView.text = status
            val colorRes = when (conversation.otpResStatus) {
                "success" -> android.R.color.holo_green_dark
                "error" -> android.R.color.holo_red_dark
                "skipped" -> android.R.color.darker_gray
                else -> android.R.color.holo_orange_dark
            }
            binding.statusTextView.setTextColor(
                ContextCompat.getColor(binding.root.context, colorRes)
            )

            binding.root.setOnClickListener {
                onConversationClicked(conversation)
            }
        }
    }

    private object DiffCallback : DiffUtil.ItemCallback<Conversation>() {
        override fun areItemsTheSame(oldItem: Conversation, newItem: Conversation): Boolean =
            oldItem.phone == newItem.phone

        override fun areContentsTheSame(oldItem: Conversation, newItem: Conversation): Boolean =
            oldItem == newItem
    }
}


