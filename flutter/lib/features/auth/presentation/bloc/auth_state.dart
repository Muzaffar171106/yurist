part of 'auth_bloc.dart';

enum AuthStatus { initial, loading, guest, authenticated, failure }

class AuthState extends Equatable {
  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.error = '',
  });

  const AuthState.initial() : this();

  final AuthStatus status;
  final AppUser? user;
  final String error;

  bool get isAuthenticated =>
      status == AuthStatus.authenticated && user != null;

  AuthState copyWith({AuthStatus? status, AppUser? user, String? error}) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error ?? this.error,
    );
  }

  @override
  List<Object?> get props => [status, user, error];
}
