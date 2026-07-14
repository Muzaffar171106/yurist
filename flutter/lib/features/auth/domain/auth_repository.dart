import 'app_user.dart';

abstract interface class AuthRepository {
  Future<AppUser?> me();
  Future<AppUser> login({required String email, required String password});
  Future<AppUser> register({
    required String name,
    required String email,
    required String password,
  });
  Future<AppUser> updateProfile({
    required String name,
    required String avatarData,
  });
  Future<void> logout();
  Future<void> deleteAccount();
}
