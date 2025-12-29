package com.example.smsheadless.ui.conversationdetail

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.smsheadless.data.model.SmsMessage
import com.example.smsheadless.di.SmsServiceLocator
import com.example.smsheadless.data.repository.SmsRepository
import com.example.smsheadless.work.SmsSyncScheduler
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class ConversationDetailUiState(
    val phone: String,
    val isLoading: Boolean = true,
    val messages: List<SmsMessage> = emptyList(),
    val errorMessage: String? = null
)

class ConversationDetailViewModel(
    private val phone: String,
    private val repository: SmsRepository,
    private val scheduler: SmsSyncScheduler
) : ViewModel() {

    private val reloadTrigger = MutableSharedFlow<Unit>(extraBufferCapacity = 1)

    val uiState: StateFlow<ConversationDetailUiState> = reloadTrigger
        .onStart { emit(Unit) }
        .flatMapLatest {
            repository.observeMessages(phone)
                .map { ConversationDetailUiState(phone = phone, messages = it, isLoading = false) }
                .onStart { emit(ConversationDetailUiState(phone = phone, isLoading = true)) }
        }
        .stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5_000),
            ConversationDetailUiState(phone = phone)
        )

    fun reload() {
        viewModelScope.launch {
            repository.retryFailed(phone)
        }
        scheduler.enqueueImmediateSync()
        reloadTrigger.tryEmit(Unit)
    }

    companion object {
        fun provideFactory(appContext: Context, phone: String): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    val repository = SmsServiceLocator.provideRepository(appContext)
                    val scheduler = SmsServiceLocator.provideScheduler(appContext)
                    return ConversationDetailViewModel(phone, repository, scheduler) as T
                }
            }
        }
    }
}


