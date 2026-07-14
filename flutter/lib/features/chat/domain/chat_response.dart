import 'package:equatable/equatable.dart';

class ChatResponse extends Equatable {
  const ChatResponse({
    required this.answer,
    this.answerId,
    this.domain,
    this.sources = const [],
    this.confidence,
    this.confidenceScore,
  });

  final String answer;
  final String? answerId;
  final String? domain;
  final List<ChatSource> sources;
  final String? confidence;
  final int? confidenceScore;

  factory ChatResponse.fromJson(Map<String, dynamic> json) {
    return ChatResponse(
      answer: json['answer'] as String,
      answerId: json['answerId'] as String?,
      domain: json['domain'] as String?,
      sources: (json['sources'] as List? ?? [])
          .map((e) => ChatSource.fromJson(e as Map<String, dynamic>))
          .toList(),
      confidence: json['confidence'] as String?,
      confidenceScore: json['confidenceScore'] as int?,
    );
  }

  @override
  List<Object?> get props => [
        answer,
        answerId,
        domain,
        sources,
        confidence,
        confidenceScore,
      ];
}

class ChatSource extends Equatable {
  const ChatSource({
    required this.id,
    required this.title,
    this.url,
    this.type,
    this.detail,
  });

  final String id;
  final String title;
  final String? url;
  final String? type;
  final String? detail;

  factory ChatSource.fromJson(Map<String, dynamic> json) {
    return ChatSource(
      id: json['id'] as String,
      title: json['title'] as String,
      url: json['url'] as String?,
      type: json['type'] as String?,
      detail: json['detail'] as String?,
    );
  }

  @override
  List<Object?> get props => [id, title, url, type, detail];
}
