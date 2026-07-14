import '../../../core/network/api_client.dart';
import '../domain/agencies_repository.dart';
import '../domain/agency.dart';

class AgenciesRepositoryImpl implements AgenciesRepository {
  AgenciesRepositoryImpl(this._client);

  final ApiClient _client;

  @override
  Future<List<Agency>> getNearestAgencies({
    required double lat,
    required double lng,
  }) async {
    final response = await _client.dio.post<List<dynamic>>(
      '/api/agencies/nearest',
      data: {
        'lat': lat,
        'lng': lng,
      },
    );
    
    return (response.data ?? [])
        .map((e) => Agency.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
