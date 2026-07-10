import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/chat_message.dart';
import '../../domain/chat_repository.dart';

part 'chat_event.dart';
part 'chat_state.dart';

class ChatBloc extends Bloc<ChatEvent, ChatState> {
  ChatBloc(this._repository) : super(const ChatState()) {
    on<ChatQuestionSubmitted>(_onQuestionSubmitted);
    on<ChatLanguageChanged>(_onLanguageChanged);
    on<ChatPersonTypeChanged>(_onPersonTypeChanged);
  }

  final ChatRepository _repository;

  Future<void> _onQuestionSubmitted(
    ChatQuestionSubmitted event,
    Emitter<ChatState> emit,
  ) async {
    final text = event.question.trim();
    if (text.isEmpty || state.loading) return;

    final messages = [
      ...state.messages,
      ChatMessage(
        role: ChatRole.user,
        content: text,
        createdAt: DateTime.now(),
      ),
    ];
    emit(state.copyWith(messages: messages, loading: true, error: ''));

    try {
      final answer = await _repository.ask(
        question: text,
        language: state.language,
        personType: state.personType,
      );
      emit(
        state.copyWith(
          loading: false,
          messages: [
            ...messages,
            ChatMessage(
              role: ChatRole.assistant,
              content: answer,
              createdAt: DateTime.now(),
            ),
          ],
        ),
      );
    } catch (error) {
      emit(state.copyWith(loading: false, error: error.toString()));
    }
  }

  void _onLanguageChanged(ChatLanguageChanged event, Emitter<ChatState> emit) {
    emit(state.copyWith(language: event.language));
  }

  void _onPersonTypeChanged(
    ChatPersonTypeChanged event,
    Emitter<ChatState> emit,
  ) {
    emit(state.copyWith(personType: event.personType));
  }
}
