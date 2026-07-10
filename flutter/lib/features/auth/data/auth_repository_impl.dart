import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/network/api_client.dart';
import '../domain/app_user.dart';
import '../domain/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._client, this._preferences);

  final ApiClient _client;
  final SharedPreferences _preferences;

  static const _userKey = 'yurist_ai_user';

  @override
  Future<AppUser?> me() async {
    try {
      final response = await _client.dio.get<Map<String, dynamic>>(
        '/api/auth/me',
      );
      final userJson = response.data?['user'];
      if (userJson is Map<String, dynamic>) {
        final user = AppUser.fromJson(userJson);
        await _cache(user);
        return user;
      }
    } catch (_) {
      final cached = _preferences.getString(_userKey);
      if (cached != null) {
        return AppUser.fromJson(jsonDecode(cached) as Map<String, dynamic>);
      }
    }
    return null;
  }

  @override
  Future<AppUser> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/api/auth/login',
      data: {'email': email, 'password': password},
    );
    return _extractAndCache(response);
  }

  @override
  Future<AppUser> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/api/auth/register',
      data: {'name': name, 'email': email, 'password': password},
    );
    return _extractAndCache(response);
  }

  @override
  Future<AppUser> updateProfile({
    required String name,
    required String avatarData,
  }) async {
    final response = await _client.dio.put<Map<String, dynamic>>(
      '/api/auth/profile',
      data: {'name': name, 'avatarData': avatarData},
    );
    return _extractAndCache(response);
  }

  @override
  Future<void> logout() async {
    try {
      await _client.dio.post<void>('/api/auth/logout');
    } catch (_) {
      // Local cache still needs to be cleared even if the server is offline.
    }
    await _preferences.remove(_userKey);
  }

  AppUser _extractAndCache(Response<Map<String, dynamic>> response) {
    final userJson = response.data?['user'];
    if (userJson is! Map<String, dynamic>) {
      throw StateError('User data topilmadi');
    }
    final user = AppUser.fromJson(userJson);
    _cache(user);
    return user;
  }

  Future<void> _cache(AppUser user) =>
      _preferences.setString(_userKey, jsonEncode(user.toJson()));
}
