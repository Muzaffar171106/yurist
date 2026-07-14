import '../../../core/network/api_client.dart';
import '../domain/legal_news.dart';
import '../domain/news_repository.dart';

class NewsRepositoryImpl implements NewsRepository {
  NewsRepositoryImpl(this._client);

  final ApiClient _client;

  @override
  Future<List<LegalNews>> getLatestNews() async {
    final response = await _client.dio.get<List<dynamic>>('/api/legal-news');
    
    return (response.data ?? [])
        .map((e) => LegalNews.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
