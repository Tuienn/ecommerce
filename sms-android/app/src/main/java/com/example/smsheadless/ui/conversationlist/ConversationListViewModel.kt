package com.example.smsheadless.ui.conversationlist

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.smsheadless.data.model.Conversation
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

data class ConversationListUiState(
    val isLoading: Boolean = true,
    val conversations: List<Conversation> = emptyList(),
    val errorMessage: String? = null
)

class ConversationListViewModel(
    private val repository: SmsRepository,
    private val scheduler: SmsSyncScheduler
) : ViewModel() {

    private val reloadTrigger = MutableSharedFlow<Unit>(extraBufferCapacity = 1)

    val uiState: StateFlow<ConversationListUiState> = reloadTrigger
        .onStart { emit(Unit) }
        .flatMapLatest {
            repository.observeConversations()
                .map { ConversationListUiState(isLoading = false, conversations = it) }
                .onStart { emit(ConversationListUiState(isLoading = true)) }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = ConversationListUiState()
        )

    fun reload() {
        viewModelScope.launch {
            repository.retryFailed()
        }
        scheduler.enqueueImmediateSync()
        reloadTrigger.tryEmit(Unit)
    }

    companion object {
        fun provideFactory(appContext: Context): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    val repository = SmsServiceLocator.provideRepository(appContext)
                    val scheduler = SmsServiceLocator.provideScheduler(appContext)
                    return ConversationListViewModel(repository, scheduler) as T
                }
            }
        }
    }
}


