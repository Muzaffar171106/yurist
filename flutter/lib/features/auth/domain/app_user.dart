import 'package:equatable/equatable.dart';

class AppUser extends Equatable {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.avatarData = '',
  });

  final String id;
  final String name;
  final String email;
  final String avatarData;

  String get initials {
    final source = email.isNotEmpty ? email : name;
    return source.isEmpty ? '?' : source.substring(0, 1).toUpperCase();
  }

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
    id: json['id'] as String? ?? '',
    name: json['name'] as String? ?? '',
    email: json['email'] as String? ?? '',
    avatarData: json['avatarData'] as String? ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'avatarData': avatarData,
  };

  @override
  List<Object?> get props => [id, name, email, avatarData];
}
