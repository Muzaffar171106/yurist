abstract interface class ChatRepository {
  Future<String> ask({
    required String question,
    required String language,
    required String personType,
  });
}
