import 'package:dio/dio.dart';

import '../config/app_config.dart';

class ApiClient {
  ApiClient()
    : dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 30),
          headers: {'content-type': 'application/json'},
        ),
      );

  final Dio dio;
}
