import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/agencies/data/agencies_repository_impl.dart';
import '../../features/agencies/domain/agencies_repository.dart';
import '../../features/auth/data/auth_repository_impl.dart';
import '../../features/auth/domain/auth_repository.dart';
import '../../features/chat/data/chat_repository_impl.dart';
import '../../features/chat/domain/chat_repository.dart';
import '../../features/image_case/data/image_case_repository_impl.dart';
import '../../features/image_case/domain/image_case_repository.dart';
import '../../features/news/data/news_repository_impl.dart';
import '../../features/news/domain/news_repository.dart';
import '../network/api_client.dart';

final sl = GetIt.instance;

Future<void> configureDependencies() async {
  final preferences = await SharedPreferences.getInstance();
  sl
    ..registerLazySingleton(() => preferences)
    ..registerLazySingleton(() => ApiClient(sl<SharedPreferences>()))
    ..registerLazySingleton<AuthRepository>(
      () => AuthRepositoryImpl(sl<ApiClient>(), sl<SharedPreferences>()),
    )
    ..registerLazySingleton<ChatRepository>(
      () => ChatRepositoryImpl(sl<ApiClient>()),
    )
    ..registerLazySingleton<NewsRepository>(
      () => NewsRepositoryImpl(sl<ApiClient>()),
    )
    ..registerLazySingleton<AgenciesRepository>(
      () => AgenciesRepositoryImpl(sl<ApiClient>()),
    )
    ..registerLazySingleton<ImageCaseRepository>(
      () => ImageCaseRepositoryImpl(sl<ApiClient>()),
    );
}
