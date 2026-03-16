import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../api/api_client.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = false;
  String? _token;
  Map<String, dynamic>? _user;

  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null;
  Map<String, dynamic>? get user => _user;

  Future<void> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    if (_token != null) {
      // Opcional: Fetch user details pra validar token
      try {
        final res = await _apiClient.get('/mobile/auth/me'); // A ser criado no backend
        if (res.statusCode == 200) {
          _user = res.data['user'];
        }
      } catch (e) {
        // Token inválido
        await logout();
      }
    }
    notifyListeners();
  }

  // Retorna null se sucesso, ou a mensagem de erro se falha
  Future<String?> login(String identifier, String password, {String userType = 'client'}) async {
    _isLoading = true;
    notifyListeners();
    try {
      // POST customizado no backend que retornará JWT
      final response = await _apiClient.post('/mobile/auth/login', data: {'identifier': identifier, 'password': password, 'userType': userType});
      if (response.statusCode == 200) {
        _token = response.data['token'];
        _user = response.data['user'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);

        _isLoading = false;
        notifyListeners();
        return null; // Sucesso
      }
    } on DioException catch (e) {
      _isLoading = false;
      notifyListeners();
      if (e.response != null && e.response?.data != null && e.response?.data['error'] != null) {
        return e.response?.data['error'];
      }
      return 'Erro de conexão com o servidor.';
    } catch (e) {
      print('Login error: $e');
    }
    _isLoading = false;
    notifyListeners();
    return 'Erro inesperado ao realizar login.';
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    notifyListeners();
  }
}
