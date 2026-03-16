import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';

class AdminQuotesScreen extends StatefulWidget {
  const AdminQuotesScreen({super.key});

  @override
  State<AdminQuotesScreen> createState() => _AdminQuotesScreenState();
}

class _AdminQuotesScreenState extends State<AdminQuotesScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  List<dynamic> _quotes = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchQuotes();
  }

  Future<void> _fetchQuotes() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _apiClient.get('/quotes');
      if (response.statusCode == 200) {
        setState(() {
          _quotes = response.data;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Erro ao carregar cotações';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Falha de comunicação com o servidor';
        _isLoading = false;
      });
    }
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'R\$ 0,00';
    try {
      final num val = value is String ? num.parse(value) : value;
      return 'R\$ ${val.toStringAsFixed(2).replaceAll('.', ',')}';
    } catch (e) {
      return 'R\$ 0,00';
    }
  }

  Map<String, dynamic> _getStatus(String? status) {
    switch (status) {
      case 'quoted':
        return {'label': 'Nova Cotação', 'color': Colors.blue};
      case 'approved':
        return {'label': 'Aprovado (Aguardando Pgto)', 'color': Colors.orange};
      case 'in_production':
        return {'label': 'Em Produção', 'color': Colors.deepPurple};
      case 'completed':
        return {'label': 'Finalizado', 'color': Colors.green};
      case 'rejected':
        return {'label': 'Rejeitado / Cancelado', 'color': Colors.red};
      case 'payment_pending':
        return {'label': 'Aguardando PIX', 'color': Colors.orangeAccent};
      default:
        return {'label': 'Desconhecido', 'color': Colors.grey};
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cotações Recebidas', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: () => _fetchQuotes())],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 64),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _fetchQuotes, child: const Text('Tentar Novamente')),
          ],
        ),
      );
    }

    if (_quotes.isEmpty) {
      return const Center(
        child: Text('Nenhuma cotação encontrada.', style: TextStyle(fontSize: 16, color: Colors.black54)),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchQuotes,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _quotes.length,
        itemBuilder: (context, index) {
          final quote = _quotes[index];
          final statusInfo = _getStatus(quote['status']);

          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                context.push('/admin-quote/${quote['id']}');
              },
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            quote['title'] ?? 'Cotação #${quote['id']}',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: (statusInfo['color'] as Color).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: statusInfo['color'] as Color),
                          ),
                          child: Text(
                            statusInfo['label'],
                            style: TextStyle(color: statusInfo['color'], fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('Cliente: ${quote['client_name'] ?? 'Visitante/Avulso'}', style: const TextStyle(fontSize: 14, color: Colors.black87)),
                    const SizedBox(height: 4),
                    Text('Material: ${(quote['filament_type'] ?? '') + ' ' + (quote['filament_color'] ?? '')} (${quote['filament_used_g']}g)', style: const TextStyle(fontSize: 14, color: Colors.black54)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'ID: #${quote['id']}',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.grey),
                        ),
                        Text(
                          _formatCurrency(quote['final_price']),
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.green),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
