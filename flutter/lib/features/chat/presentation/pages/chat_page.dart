import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../domain/chat_message.dart';
import '../bloc/chat_bloc.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthBloc>().state.user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Huquqiy maslahat'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              avatar: CircleAvatar(child: Text(user?.initials ?? '?')),
              label: Text(
                user?.name.isNotEmpty == true ? user!.name : 'Profil',
              ),
              onPressed: () => Navigator.of(context).pushNamed('/profile'),
            ),
          ),
        ],
      ),
      body: BlocBuilder<ChatBloc, ChatState>(
        builder: (context, state) {
          return Column(
            children: [
              _Toolbar(state: state),
              Expanded(
                child: state.messages.isEmpty
                    ? const _WelcomePanel()
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.messages.length,
                        itemBuilder: (context, index) =>
                            _MessageBubble(message: state.messages[index]),
                      ),
              ),
              if (state.error.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    state.error,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          minLines: 1,
                          maxLines: 5,
                          decoration: const InputDecoration(
                            hintText: 'Vaziyatingizni yozing...',
                          ),
                          onSubmitted: (_) => _send(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      FilledButton(
                        onPressed: state.loading ? null : _send,
                        child: state.loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.arrow_upward),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _send() {
    context.read<ChatBloc>().add(ChatQuestionSubmitted(_controller.text));
    _controller.clear();
  }
}

class _Toolbar extends StatelessWidget {
  const _Toolbar({required this.state});

  final ChatState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ChatBloc>();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          ChoiceChip(
            label: const Text('Jismoniy shaxs'),
            selected: state.personType == 'individual',
            onSelected: (_) =>
                bloc.add(const ChatPersonTypeChanged('individual')),
          ),
          ChoiceChip(
            label: const Text('Yuridik shaxs'),
            selected: state.personType == 'legal',
            onSelected: (_) => bloc.add(const ChatPersonTypeChanged('legal')),
          ),
          DropdownButton<String>(
            value: state.language,
            items: const [
              DropdownMenuItem(value: 'uz-latn', child: Text("O'zbek")),
              DropdownMenuItem(value: 'uz-cyrl', child: Text('Ўзбек')),
              DropdownMenuItem(value: 'ru', child: Text('Русский')),
            ],
            onChanged: (value) {
              if (value != null) bloc.add(ChatLanguageChanged(value));
            },
          ),
        ],
      ),
    );
  }
}

class _WelcomePanel extends StatelessWidget {
  const _WelcomePanel();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Card(
        margin: const EdgeInsets.all(20),
        child: Padding(
          padding: const EdgeInsets.all(26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                'assets/images/yurist_ai_logo.png',
                width: 92,
                height: 92,
              ),
              const SizedBox(height: 16),
              Text(
                "Huquqingizni tushunarli tilda biling",
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Savolingizga manbali, amaliy va oddiy tilda javob olasiz.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == ChatRole.user;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 760),
        child: Card(
          color: isUser ? const Color(0xFFE7F0EA) : Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SelectableText(message.content),
          ),
        ),
      ),
    );
  }
}
