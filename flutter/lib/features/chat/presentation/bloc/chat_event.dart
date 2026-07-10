part of 'chat_bloc.dart';

sealed class ChatEvent extends Equatable {
  const ChatEvent();

  @override
  List<Object?> get props => [];
}

final class ChatQuestionSubmitted extends ChatEvent {
  const ChatQuestionSubmitted(this.question);

  final String question;

  @override
  List<Object?> get props => [question];
}

final class ChatLanguageChanged extends ChatEvent {
  const ChatLanguageChanged(this.language);

  final String language;

  @override
  List<Object?> get props => [language];
}

final class ChatPersonTypeChanged extends ChatEvent {
  const ChatPersonTypeChanged(this.personType);

  final String personType;

  @override
  List<Object?> get props => [personType];
}
