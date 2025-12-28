package com.example.smsheadless.ui.conversationlist

import android.os.Bundle
import android.view.View
import androidx.core.os.bundleOf
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.smsheadless.R
import com.example.smsheadless.data.model.Conversation
import com.example.smsheadless.databinding.FragmentConversationListBinding
import com.example.smsheadless.ui.conversationdetail.ConversationDetailFragment
import kotlinx.coroutines.launch

class ConversationListFragment : Fragment(R.layout.fragment_conversation_list) {

    private var _binding: FragmentConversationListBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ConversationListViewModel by viewModels {
        ConversationListViewModel.provideFactory(requireContext().applicationContext)
    }

    private val adapter: ConversationAdapter by lazy {
        ConversationAdapter { conversation -> navigateToConversation(conversation) }
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentConversationListBinding.bind(view)

        setupList()
        
        binding.toolbar.inflateMenu(R.menu.menu_reload)
        binding.toolbar.setOnMenuItemClickListener {
            when (it.itemId) {
                R.id.action_reload -> {
                    viewModel.reload()
                    true
                }
                else -> false
            }
        }

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    renderState(state)
                }
            }
        }
    }

    private fun setupList() {
        val layoutManager = LinearLayoutManager(requireContext())
        binding.conversationRecycler.layoutManager = layoutManager
        binding.conversationRecycler.adapter = adapter
        binding.conversationRecycler.addItemDecoration(
            DividerItemDecoration(requireContext(), layoutManager.orientation)
        )
    }

    private fun renderState(state: ConversationListUiState) {
        binding.progressBar.isVisible = state.isLoading && state.conversations.isEmpty()
        binding.emptyView.isVisible = !state.isLoading && state.conversations.isEmpty()
        binding.errorView.isVisible = state.errorMessage != null
        binding.errorView.text = state.errorMessage.orEmpty()
        binding.conversationRecycler.isVisible = state.conversations.isNotEmpty()
        adapter.submitList(state.conversations)
    }

    private fun navigateToConversation(conversation: Conversation) {
        findNavController().navigate(
            R.id.action_conversationListFragment_to_conversationDetailFragment,
            bundleOf(ConversationDetailFragment.ARG_PHONE to conversation.phone)
        )
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}


