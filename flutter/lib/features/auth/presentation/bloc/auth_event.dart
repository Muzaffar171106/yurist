part of 'auth_bloc.dart';

sealed class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

final class AuthBootstrapRequested extends AuthEvent {
  const AuthBootstrapRequested();
}

final class AuthLoginSubmitted extends AuthEvent {
  const AuthLoginSubmitted({required this.email, required this.password});

  final String email;
  final String password;

  @override
  List<Object?> get props => [email, password];
}

final class AuthRegisterSubmitted extends AuthEvent {
  const AuthRegisterSubmitted({
    required this.name,
    required this.email,
    required this.password,
  });

  final String name;
  final String email;
  final String password;

  @override
  List<Object?> get props => [name, email, password];
}

final class AuthProfileUpdated extends AuthEvent {
  const AuthProfileUpdated({required this.name, required this.avatarData});

  final String name;
  final String avatarData;

  @override
  List<Object?> get props => [name, avatarData];
}

final class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}
