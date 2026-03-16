import 'package:flutter/material.dart';

class NewQuoteScreen extends StatelessWidget {
  const NewQuoteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nova Cotação')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.upload_file, size: 80, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 16),
            const Text(
              'Faça o upload do seu modelo 3D (STL/OBJ)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text('Em breve: Motor de fatiamento integrado no App.', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                // To be implemented
              },
              icon: const Icon(Icons.cloud_upload),
              label: const Text('Selecionar Arquivo'),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
            ),
          ],
        ),
      ),
    );
  }
}
