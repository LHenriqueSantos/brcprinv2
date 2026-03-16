import 'package:flutter/material.dart';

class ProductionQueueScreen extends StatelessWidget {
  const ProductionQueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fila de Produção'), backgroundColor: Colors.orange, foregroundColor: Colors.white),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.precision_manufacturing, size: 80, color: Colors.orange),
            const SizedBox(height: 16),
            const Text(
              'Gerenciamento de Máquinas',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text('Acompanhe o que está sendo impresso.', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
