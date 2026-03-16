import 'package:flutter/material.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Meus Pedidos')),
      body: ListView.builder(
        itemCount: 3, // Dummy count
        itemBuilder: (context, index) {
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ListTile(
              leading: Icon(Icons.check_circle_outline, color: Theme.of(context).colorScheme.secondary, size: 32),
              title: Text('Pedido #${1000 + index}'),
              subtitle: const Text('Status: Em Produção\nFinalizado em aprox. 2 dias'),
              trailing: const Icon(Icons.chevron_right),
              isThreeLine: true,
              onTap: () {
                // To be implemented: Order details
              },
            ),
          );
        },
      ),
    );
  }
}
