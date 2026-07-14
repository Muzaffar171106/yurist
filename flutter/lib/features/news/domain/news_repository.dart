import 'legal_news.dart';

abstract interface class NewsRepository {
  Future<List<LegalNews>> getLatestNews();
}
