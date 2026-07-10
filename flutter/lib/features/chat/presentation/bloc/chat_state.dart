part of 'chat_bloc.dart';

class ChatState extends Equatable {
  const ChatState({
    this.messages = const [],
    this.loading = false,
    this.error = '',
    this.language = 'uz-latn',
    this.personType = 'individual',
  });

  final List<ChatMessage> messages;
  final bool loading;
  final String error;
  final String language;
  final String personType;

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? loading,
    String? error,
    String? language,
    String? personType,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      loading: loading ?? this.loading,
      error: error ?? this.error,
      language: language ?? this.language,
      personType: personType ?? this.personType,
    );
  }

  @override
  List<Object?> get props => [messages, loading, error, language, personType];
}
