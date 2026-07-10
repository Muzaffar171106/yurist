import '../../../core/network/api_client.dart';
import '../domain/chat_repository.dart';

class ChatRepositoryImpl implements ChatRepository {
  ChatRepositoryImpl(this._client);

  final ApiClient _client;

  @override
  Future<String> ask({
    required String question,
    required String language,
    required String personType,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/api/chat',
      data: {
        'question': question,
        'language': language,
        'personType': personType,
        'online': true,
      },
    );
    return response.data?['answer'] as String? ?? 'Javob topilmadi.';
  }
}
