import 'package:equatable/equatable.dart';

class Agency extends Equatable {
  const Agency({
    required this.name,
    this.address,
    this.lat,
    this.lng,
    this.distance,
    this.phone,
  });

  final String name;
  final String? address;
  final double? lat;
  final double? lng;
  final double? distance;
  final String? phone;

  factory Agency.fromJson(Map<String, dynamic> json) {
    return Agency(
      name: json['name'] as String,
      address: json['address'] as String?,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      distance: (json['distance'] as num?)?.toDouble(),
      phone: json['phone'] as String?,
    );
  }

  @override
  List<Object?> get props => [name, address, lat, lng, distance, phone];
}
