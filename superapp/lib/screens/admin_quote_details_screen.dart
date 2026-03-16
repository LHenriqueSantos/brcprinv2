import 'package:flutter/material.dart';
import '../api/api_client.dart';
import 'package:url_launcher/url_launcher.dart';

class AdminQuoteDetailsScreen extends StatefulWidget {
  final String quoteId;
  const AdminQuoteDetailsScreen({super.key, required this.quoteId});

  @override
  State<AdminQuoteDetailsScreen> createState() => _AdminQuoteDetailsScreenState();
}

class _AdminQuoteDetailsScreenState extends State<AdminQuoteDetailsScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  bool _isUpdating = false;
  Map<String, dynamic>? _quote;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchQuoteDetails();
  }

  Future<void> _fetchQuoteDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _apiClient.get('/quotes/${widget.quoteId}');
      if (response.statusCode == 200) {
        setState(() {
          _quote = response.data;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Erro ao carregar detalhes da cotação.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Falha de comunicação com o servidor.\n$e';
        _isLoading = false;
      });
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _isUpdating = true);
    try {
      final response = await _apiClient.put('/quotes/${widget.quoteId}/status', data: {'status': newStatus});

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Status atualizado com sucesso!'), backgroundColor: Colors.green));
          _fetchQuoteDetails();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erro ao atualizar status.'), backgroundColor: Colors.red));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Falha na conexão: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isUpdating = false);
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
        return {'label': 'Desconhecido ($status)', 'color': Colors.grey};
    }
  }

  Future<void> _DownloadSTL() async {
    final fileUrl = _quote?['file_url'];
    if (fileUrl != null && fileUrl.toString().isNotEmpty) {
      final uri = Uri.parse(fileUrl);
      if (!await launchUrl(uri)) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Não foi possível abrir o link.'), backgroundColor: Colors.red));
      }
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sem arquivo STL anexado.'), backgroundColor: Colors.orange));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text('Cotação #${widget.quoteId}', style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchQuoteDetails)],
      ),
      body: _buildBody(),
      bottomNavigationBar: _buildBottomActions(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 64),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _fetchQuoteDetails, child: const Text('Tentar Novamente')),
          ],
        ),
      );
    }

    if (_quote == null) return const Center(child: Text('Cotação não encontrada.'));

    final statusInfo = _getStatus(_quote!['status']);

    return RefreshIndicator(
      onRefresh: _fetchQuoteDetails,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Resumo do Pedido Header
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(_quote!['title'] ?? 'Sem Título', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: (statusInfo['color'] as Color).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: statusInfo['color']),
                          ),
                          child: Text(
                            statusInfo['label'],
                            style: TextStyle(color: statusInfo['color'], fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 32),
                    _buildInfoRow('Cliente', _quote!['client_name'] ?? _quote!['client_email'] ?? 'Visitante/Avulso', Icons.person),
                    const SizedBox(height: 12),
                    _buildInfoRow('Impressora', _quote!['printer_name'] ?? '-', Icons.print),
                    const SizedBox(height: 12),
                    _buildInfoRow('Material', '${_quote!['filament_type'] ?? ''} ${_quote!['filament_color'] ?? ''}', Icons.category),
                    const SizedBox(height: 12),
                    _buildInfoRow('Tempo Total', '${_quote!['print_time_hours'] ?? 0}h', Icons.timer),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Resumo Financeiro
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Resumo Financeiro', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildFinancialRow('Custo Material (${_quote!['filament_used_g'] ?? 0}g)', _formatCurrency(_quote!['cost_filament'])),
                    _buildFinancialRow('Custo Energia', _formatCurrency(_quote!['cost_energy'])),
                    _buildFinancialRow('Custo Depreciação/Mnt.', _formatCurrency((num.parse(_quote!['cost_depreciation']?.toString() ?? '0') + num.parse(_quote!['cost_maintenance']?.toString() ?? '0')))),
                    _buildFinancialRow('Custo de Hora Técnica', _formatCurrency(_quote!['cost_labor'])),
                    const Divider(height: 24),
                    _buildFinancialRow('Valor Final Unidade', _formatCurrency(_quote!['final_price_per_unit'])),
                    _buildFinancialRow('Quantidade', '${_quote!['quantity'] ?? 1}x'),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Final', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text(
                          _formatCurrency(_quote!['final_price']),
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.green),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Ficheiros e Anexos
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                leading: const Icon(Icons.file_download, color: Colors.deepPurple, size: 36),
                title: const Text('Arquivo STL/OBJ Anexado', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('Toque para tentar visualizar ou baixar.'),
                trailing: const Icon(Icons.download),
                onTap: _DownloadSTL,
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.black54),
        ),
        Expanded(
          child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  Widget _buildFinancialRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black54)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget? _buildBottomActions() {
    if (_quote == null || _isLoading) return null;
    final status = _quote!['status'];

    if (status == 'quoted' || status == 'payment_pending') {
      return Container(
        color: Colors.white,
        padding: const EdgeInsets.all(16.0),
        child: SafeArea(
          child: Row(
            children: [
              if (status == 'quoted')
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isUpdating ? null : () => _updateStatus('rejected'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Rejeitar'),
                  ),
                ),
              if (status == 'quoted') const SizedBox(width: 16),

              Expanded(
                child: ElevatedButton(
                  onPressed: _isUpdating ? null : () => _updateStatus('in_production'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: _isUpdating ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Aprovar p/ Produção'),
                ),
              ),
            ],
          ),
        ),
      );
    } else if (status == 'in_production') {
      return Container(
        color: Colors.white,
        padding: const EdgeInsets.all(16.0),
        child: SafeArea(
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isUpdating ? null : () => _updateStatus('completed'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
              child: _isUpdating ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Marcar como Finalizado'),
            ),
          ),
        ),
      );
    }

    return null;
  }
}
