import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';

class ApiClient {
  final Dio _dio;
  final SharedPreferences _preferences;

  static const _cookieKey = 'api_session_cookie';

  ApiClient(this._preferences)
      : _dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 30),
            headers: {
              'content-type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final cookie = _preferences.getString(_cookieKey);
          if (cookie != null) {
            options.headers['Cookie'] = cookie;
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          final setCookie = response.headers.value('set-cookie');
          if (setCookie != null) {
            // Faqat sessiya cookie-sini ajratib olish (yurist_ai_session)
            final sessionCookie = setCookie.split(';').firstWhere(
                  (element) => element.contains('yurist_ai_session'),
                  orElse: () => '',
                );
            if (sessionCookie.isNotEmpty) {
              _preferences.setString(_cookieKey, sessionCookie);
            }
          }
          return handler.next(response);
        },
      ),
    );
    _dio.interceptors.add(
      LogInterceptor(responseBody: true, requestBody: true),
    );
  }

  Dio get dio => _dio;

  Future<void> clearSession() async {
    await _preferences.remove(_cookieKey);
  }
}
