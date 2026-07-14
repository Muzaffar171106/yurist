import 'package:equatable/equatable.dart';

class ImageAnalysisResult extends Equatable {
  const ImageAnalysisResult({
    required this.analysis,
    this.initialAssessment,
    this.suggestedSteps = const [],
  });

  final String analysis;
  final String? initialAssessment;
  final List<String> suggestedSteps;

  factory ImageAnalysisResult.fromJson(Map<String, dynamic> json) {
    return ImageAnalysisResult(
      analysis: json['analysis'] as String,
      initialAssessment: json['initialAssessment'] as String?,
      suggestedSteps: List<String>.from(json['suggestedSteps'] ?? []),
    );
  }

  @override
  List<Object?> get props => [analysis, initialAssessment, suggestedSteps];
}
