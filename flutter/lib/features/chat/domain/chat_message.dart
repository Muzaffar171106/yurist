import 'package:equatable/equatable.dart';

enum ChatRole { user, assistant }

class ChatMessage extends Equatable {
  const ChatMessage({
    required this.role,
    required this.content,
    this.createdAt,
  });

  final ChatRole role;
  final String content;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [role, content, createdAt];
}
