import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';

import '../../../auth/presentation/bloc/auth_bloc.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _name = TextEditingController();
  String _avatarData = '';

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthBloc>().state.user;
    _name.text = user?.name ?? '';
    _avatarData = user?.avatarData ?? '';
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthBloc>().state;
    final user = auth.user;
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Card(
            margin: const EdgeInsets.all(20),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: CircleAvatar(
                      radius: 46,
                      backgroundImage: _avatarBytes == null
                          ? null
                          : MemoryImage(_avatarBytes!),
                      child: _avatarBytes == null
                          ? Text(
                              user?.initials ?? '?',
                              style: const TextStyle(fontSize: 30),
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: _pickAvatar,
                    icon: const Icon(Icons.photo_camera_outlined),
                    label: const Text('Rasm tanlash'),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _avatarData = ''),
                    child: const Text('Default avatar qilish'),
                  ),
                  TextField(
                    controller: _name,
                    decoration: const InputDecoration(labelText: 'Ism'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    enabled: false,
                    controller: TextEditingController(text: user?.email ?? ''),
                    decoration: const InputDecoration(labelText: 'Email'),
                  ),
                  if (auth.error.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      auth.error,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _save,
                    child: const Text('Saqlash'),
                  ),
                  TextButton(
                    onPressed: () {
                      final navigator = Navigator.of(context);
                      context.read<AuthBloc>().add(const AuthLogoutRequested());
                      if (mounted) {
                        navigator.pushNamedAndRemoveUntil(
                          '/auth',
                          (_) => false,
                        );
                      }
                    },
                    child: const Text('Chiqish'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Uint8List? get _avatarBytes {
    if (_avatarData.isEmpty || !_avatarData.contains(',')) {
      return null;
    }
    return base64Decode(_avatarData.split(',').last);
  }

  Future<void> _pickAvatar() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 82,
      maxWidth: 512,
      maxHeight: 512,
    );
    if (picked == null) {
      return;
    }
    final bytes = await picked.readAsBytes();
    setState(
      () => _avatarData = 'data:image/jpeg;base64,${base64Encode(bytes)}',
    );
  }

  void _save() {
    final navigator = Navigator.of(context);
    context.read<AuthBloc>().add(
      AuthProfileUpdated(name: _name.text.trim(), avatarData: _avatarData),
    );
    if (mounted) {
      navigator.pop();
    }
  }
}
