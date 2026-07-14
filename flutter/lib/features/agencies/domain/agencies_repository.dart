import 'agency.dart';

abstract interface class AgenciesRepository {
  Future<List<Agency>> getNearestAgencies({
    required double lat,
    required double lng,
  });
}
