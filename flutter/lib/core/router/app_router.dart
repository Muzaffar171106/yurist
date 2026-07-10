import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/pages/auth_page.dart';
import '../../features/chat/presentation/pages/chat_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';

class AppRouter {
  const AppRouter._();

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    return MaterialPageRoute<void>(
      settings: settings,
      builder: (context) {
        final authenticated = context.read<AuthBloc>().state.isAuthenticated;
        return switch (settings.name) {
          '/profile' when authenticated => const ProfilePage(),
          '/chat' when authenticated => const ChatPage(),
          '/auth' => const AuthPage(),
          _ => authenticated ? const ChatPage() : const AuthPage(),
        };
      },
    );
  }
}
