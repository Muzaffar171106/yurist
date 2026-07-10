import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/widgets/brand_header.dart';
import '../bloc/auth_bloc.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _register = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 460),
            child: Card(
              margin: const EdgeInsets.all(20),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: BlocConsumer<AuthBloc, AuthState>(
                  listener: (context, state) {
                    if (state.isAuthenticated) {
                      Navigator.of(context).pushReplacementNamed('/chat');
                    }
                  },
                  builder: (context, state) {
                    return Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const BrandHeader(
                            subtitle: 'Hisob orqali xavfsiz maslahat',
                          ),
                          const SizedBox(height: 24),
                          SegmentedButton<bool>(
                            segments: const [
                              ButtonSegment(
                                value: false,
                                label: Text('Kirish'),
                              ),
                              ButtonSegment(
                                value: true,
                                label: Text("Ro'yxat"),
                              ),
                            ],
                            selected: {_register},
                            onSelectionChanged: (value) =>
                                setState(() => _register = value.first),
                          ),
                          const SizedBox(height: 18),
                          if (_register)
                            TextFormField(
                              controller: _name,
                              decoration: const InputDecoration(
                                labelText: 'Ism',
                              ),
                              validator: (value) =>
                                  (value ?? '').trim().length < 2
                                  ? 'Ism kiriting'
                                  : null,
                            ),
                          if (_register) const SizedBox(height: 12),
                          TextFormField(
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'Email',
                            ),
                            validator: (value) => (value ?? '').contains('@')
                                ? null
                                : "Email noto'g'ri",
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _password,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Parol',
                            ),
                            validator: (value) => (value ?? '').length < 8
                                ? 'Kamida 8 belgi'
                                : null,
                          ),
                          if (state.error.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              state.error,
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.error,
                              ),
                            ),
                          ],
                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: state.status == AuthStatus.loading
                                ? null
                                : _submit,
                            child: Text(
                              _register ? "Ro'yxatdan o'tish" : 'Kirish',
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    final bloc = context.read<AuthBloc>();
    if (_register) {
      bloc.add(
        AuthRegisterSubmitted(
          name: _name.text.trim(),
          email: _email.text.trim(),
          password: _password.text,
        ),
      );
    } else {
      bloc.add(
        AuthLoginSubmitted(email: _email.text.trim(), password: _password.text),
      );
    }
  }
}
