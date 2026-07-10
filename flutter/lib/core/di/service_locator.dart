import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/auth/data/auth_repository_impl.dart';
import '../../features/auth/domain/auth_repository.dart';
import '../../features/chat/data/chat_repository_impl.dart';
import '../../features/chat/domain/chat_repository.dart';
import '../network/api_client.dart';

final sl = GetIt.instance;

Future<void> configureDependencies() async {
  final preferences = await SharedPreferences.getInstance();
  sl
    ..registerLazySingleton(() => preferences)
    ..registerLazySingleton(ApiClient.new)
    ..registerLazySingleton<AuthRepository>(
      () => AuthRepositoryImpl(sl<ApiClient>(), sl<SharedPreferences>()),
    )
    ..registerLazySingleton<ChatRepository>(
      () => ChatRepositoryImpl(sl<ApiClient>()),
    );
}
