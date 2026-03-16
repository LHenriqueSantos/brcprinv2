import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final userName = user?['name'] ?? 'Cliente';
    // Pega o primeiro nome
    final firstName = userName.contains(' ') ? userName.split(' ')[0] : userName;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('BRCPrint', style: TextStyle(fontWeight: FontWeight.w800)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sair',
            onPressed: () {
              context.read<AuthProvider>().logout();
              context.go('/login');
            },
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Olá, $firstName!',
                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.deepPurple),
              ),
              const SizedBox(height: 8),
              const Text('O que você deseja fazer hoje?', style: TextStyle(fontSize: 16, color: Colors.black54)),
              const SizedBox(height: 48),

              if (user?['userType'] == 'admin') ...[
                // Admin Dashboard
                _DashboardCard(icon: Icons.assignment, title: 'Cotações Recebidas', subtitle: 'Gerencie orçamentos e verifique arquivos 3D.', color: Colors.deepPurple, onTap: () => context.push('/admin-quotes')),
                const SizedBox(height: 16),
                _DashboardCard(icon: Icons.precision_manufacturing, title: 'Fila de Produção', subtitle: 'Acompanhe as máquinas e agendamentos.', color: Colors.orange, onTap: () => context.push('/admin-production')),
                const SizedBox(height: 16),
                _DashboardCard(icon: Icons.person_outline, title: 'Meu Perfil', subtitle: 'Alterar senha e gerenciar conta.', color: Colors.teal, onTap: () => context.push('/profile')),
              ] else ...[
                // Client Dashboard
                _DashboardCard(icon: Icons.add_circle_outline, title: 'Nova Cotação', subtitle: 'Envie um STL 3D e obtenha o preço imediatamente.', color: Colors.deepPurple, onTap: () => context.push('/new-quote')),
                const SizedBox(height: 16),
                _DashboardCard(icon: Icons.inventory_2_outlined, title: 'Meus Pedidos', subtitle: 'Acompanhe o status das suas impressões e histórico.', color: Colors.blueAccent, onTap: () => context.push('/orders')),
                const SizedBox(height: 16),
                _DashboardCard(icon: Icons.person_outline, title: 'Meu Perfil', subtitle: 'Gerencie seus dados e endereço de entrega.', color: Colors.teal, onTap: () => context.push('/profile')),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _DashboardCard({required this.icon, required this.title, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shadowColor: color.withOpacity(0.4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
                child: Icon(icon, size: 36, color: color),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text(subtitle, style: const TextStyle(fontSize: 14, color: Colors.black54)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
