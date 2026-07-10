import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/app_user.dart';
import '../../domain/auth_repository.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc(this._repository) : super(const AuthState.initial()) {
    on<AuthBootstrapRequested>(_onBootstrapRequested);
    on<AuthLoginSubmitted>(_onLoginSubmitted);
    on<AuthRegisterSubmitted>(_onRegisterSubmitted);
    on<AuthProfileUpdated>(_onProfileUpdated);
    on<AuthLogoutRequested>(_onLogoutRequested);
  }

  final AuthRepository _repository;

  Future<void> _onBootstrapRequested(
    AuthBootstrapRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, error: ''));
    final user = await _repository.me();
    emit(
      AuthState(
        status: user == null ? AuthStatus.guest : AuthStatus.authenticated,
        user: user,
      ),
    );
  }

  Future<void> _onLoginSubmitted(
    AuthLoginSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    await _run(
      emit,
      () => _repository.login(email: event.email, password: event.password),
    );
  }

  Future<void> _onRegisterSubmitted(
    AuthRegisterSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    await _run(
      emit,
      () => _repository.register(
        name: event.name,
        email: event.email,
        password: event.password,
      ),
    );
  }

  Future<void> _onProfileUpdated(
    AuthProfileUpdated event,
    Emitter<AuthState> emit,
  ) async {
    await _run(
      emit,
      () => _repository.updateProfile(
        name: event.name,
        avatarData: event.avatarData,
      ),
    );
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _repository.logout();
    emit(const AuthState(status: AuthStatus.guest));
  }

  Future<void> _run(
    Emitter<AuthState> emit,
    Future<AppUser> Function() action,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, error: ''));
    try {
      final user = await action();
      emit(AuthState(status: AuthStatus.authenticated, user: user));
    } catch (error) {
      emit(state.copyWith(status: AuthStatus.failure, error: error.toString()));
    }
  }
}
