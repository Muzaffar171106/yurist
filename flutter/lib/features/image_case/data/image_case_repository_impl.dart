import '../../../core/network/api_client.dart';
import '../domain/image_analysis_result.dart';
import '../domain/image_case_repository.dart';

class ImageCaseRepositoryImpl implements ImageCaseRepository {
  ImageCaseRepositoryImpl(this._client);

  final ApiClient _client;

  @override
  Future<ImageAnalysisResult> analyzeImage({
    required String base64Image,
    String? description,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/api/image-case',
      data: {
        'image': base64Image,
        if (description != null) 'description': description,
      },
    );
    
    if (response.data == null) {
      throw StateError('Tahlil natijasi olinmadi');
    }
    
    return ImageAnalysisResult.fromJson(response.data!);
  }
}
