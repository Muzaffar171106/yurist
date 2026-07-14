import 'image_analysis_result.dart';

abstract interface class ImageCaseRepository {
  Future<ImageAnalysisResult> analyzeImage({
    required String base64Image,
    String? description,
  });
}
