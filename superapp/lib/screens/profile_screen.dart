import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(title: const Text('Meu Perfil')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 50,
              backgroundColor: Colors.deepPurple,
              child: Icon(Icons.person, size: 50, color: Colors.white),
            ),
            const SizedBox(height: 16),
            Text(user?['name'] ?? 'Nome do Usuário', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            Text(user?['email'] ?? 'email@exemplo.com.br', style: const TextStyle(color: Colors.grey, fontSize: 16)),
            const SizedBox(height: 32),
            ListTile(leading: const Icon(Icons.location_on), title: const Text('Endereço de Entrega'), subtitle: const Text('Rua Exemplo, 123 - São Paulo, SP'), trailing: const Icon(Icons.edit), onTap: () {}),
            const Divider(),
            ListTile(leading: const Icon(Icons.security), title: const Text('Segurança e Senha'), trailing: const Icon(Icons.edit), onTap: () {}),
            const SizedBox(height: 32),
            OutlinedButton.icon(
              onPressed: () {
                // To be implemented
              },
              icon: const Icon(Icons.help_outline),
              label: const Text('Central de Ajuda'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(50)),
            ),
          ],
        ),
      ),
    );
  }
}
