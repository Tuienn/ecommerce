package com.example.smsheadless.ui.conversationdetail

import android.os.Bundle
import android.view.View
import androidx.core.content.res.ResourcesCompat
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
import com.example.smsheadless.databinding.FragmentConversationDetailBinding
import kotlinx.coroutines.launch

class ConversationDetailFragment : Fragment(R.layout.fragment_conversation_detail) {

    companion object {
        const val ARG_PHONE = "phone"
    }

    private var _binding: FragmentConversationDetailBinding? = null
    private val binding get() = _binding!!

    private val phone: String by lazy {
        arguments?.getString(ARG_PHONE).orEmpty()
    }

    private val adapter = SmsMessageAdapter()

    private val viewModel: ConversationDetailViewModel by viewModels {
        ConversationDetailViewModel.provideFactory(
            requireContext().applicationContext,
            phone
        )
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentConversationDetailBinding.bind(view)

        if (phone.isBlank()) {
            findNavController().popBackStack()
            return
        }

        setupToolbar()
        setupList()

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    renderState(state)
                }
            }
        }
    }

    private fun setupToolbar() {
        binding.toolbar.navigationIcon =
            ResourcesCompat.getDrawable(resources, R.drawable.ic_arrow_back, requireContext().theme)
        binding.toolbar.setNavigationOnClickListener {
            findNavController().navigateUp()
        }
        binding.toolbar.title = getString(R.string.conversation_detail_title, phone)
        binding.toolbar.inflateMenu(R.menu.menu_reload)
        binding.toolbar.menu.findItem(R.id.action_reload).setTitle(R.string.reload_conversation)
        binding.toolbar.setOnMenuItemClickListener {
            when (it.itemId) {
                R.id.action_reload -> {
                    viewModel.reload()
                    true
                }
                else -> false
            }
        }
    }

    private fun setupList() {
        val layoutManager = LinearLayoutManager(requireContext())
        binding.messagesRecycler.layoutManager = layoutManager
        binding.messagesRecycler.adapter = adapter
        binding.messagesRecycler.addItemDecoration(
            DividerItemDecoration(requireContext(), layoutManager.orientation)
        )
    }

    private fun renderState(state: ConversationDetailUiState) {
        binding.progressBar.isVisible = state.isLoading && state.messages.isEmpty()
        binding.emptyView.isVisible = !state.isLoading && state.messages.isEmpty()
        binding.errorView.isVisible = state.errorMessage != null
        binding.errorView.text = state.errorMessage.orEmpty()
        binding.messagesRecycler.isVisible = state.messages.isNotEmpty()
        adapter.submitList(state.messages)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}


