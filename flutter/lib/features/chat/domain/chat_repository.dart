import 'chat_response.dart';

export 'chat_response.dart';

abstract interface class ChatRepository {
  Future<ChatResponse> ask({
    required String question,
    required String language,
    required String personType,
    bool online = true,
  });

  Future<void> submitFeedback({
    required String answerId,
    required int rating,
    String? comment,
  });

  Future<List<ChatSource>> search({
    required String query,
  });
}
