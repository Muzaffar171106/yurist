import 'package:equatable/equatable.dart';

class LegalNews extends Equatable {
  const LegalNews({
    required this.title,
    required this.url,
    this.date,
    this.description,
  });

  final String title;
  final String url;
  final String? date;
  final String? description;

  factory LegalNews.fromJson(Map<String, dynamic> json) {
    return LegalNews(
      title: json['title'] as String,
      url: json['url'] as String,
      date: json['date'] as String?,
      description: json['description'] as String?,
    );
  }

  @override
  List<Object?> get props => [title, url, date, description];
}
