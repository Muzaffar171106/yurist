import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'core/di/service_locator.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/domain/auth_repository.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/chat/domain/chat_repository.dart';
import 'features/chat/presentation/bloc/chat_bloc.dart';

class YuristAiApp extends StatelessWidget {
  const YuristAiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (_) =>
              AuthBloc(sl<AuthRepository>())
                ..add(const AuthBootstrapRequested()),
        ),
        BlocProvider(create: (_) => ChatBloc(sl<ChatRepository>())),
      ],
      child: MaterialApp(
        title: 'Yurist AI',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        onGenerateRoute: AppRouter.onGenerateRoute,
      ),
    );
  }
}
