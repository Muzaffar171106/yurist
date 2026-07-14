import '../../../core/network/api_client.dart';
import '../domain/chat_repository.dart';
import '../domain/chat_response.dart';

class ChatRepositoryImpl implements ChatRepository {
  ChatRepositoryImpl(this._client);

  final ApiClient _client;

  @override
  Future<ChatResponse> ask({
    required String question,
    required String language,
    required String personType,
    bool online = true,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/api/chat',
      data: {
        'question': question,
        'language': language,
        'personType': personType,
        'online': online,
      },
    );
    
    if (response.data == null) {
      throw StateError('Javob olinmadi');
    }
    
    return ChatResponse.fromJson(response.data!);
  }

  @override
  Future<void> submitFeedback({
    required String answerId,
    required int rating,
    String? comment,
  }) async {
    await _client.dio.post<void>(
      '/api/feedback',
      data: {
        'answerId': answerId,
        'rating': rating,
        if (comment != null) 'comment': comment,
      },
    );
  }

  @override
  Future<List<ChatSource>> search({
    required String query,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/api/search',
      data: {'query': query},
    );
    
    final results = response.data?['results'] as List? ?? [];
    return results
        .map((e) => ChatSource.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
