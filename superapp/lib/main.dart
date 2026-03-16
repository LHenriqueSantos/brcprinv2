import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/admin_login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/new_quote_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/admin_quotes_screen.dart';
import 'screens/admin_quote_details_screen.dart';
import 'screens/production_queue_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final authProvider = AuthProvider();
  await authProvider.checkAuthStatus();

  runApp(
    MultiProvider(
      providers: [ChangeNotifierProvider.value(value: authProvider)],
      child: const BrcprintSuperApp(),
    ),
  );
}

class BrcprintSuperApp extends StatefulWidget {
  const BrcprintSuperApp({super.key});

  @override
  State<BrcprintSuperApp> createState() => _BrcprintSuperAppState();
}

class _BrcprintSuperAppState extends State<BrcprintSuperApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = GoRouter(
      initialLocation: context.read<AuthProvider>().isAuthenticated ? '/home' : '/login',
      routes: [
        GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
        GoRoute(path: '/admin-login', builder: (context, state) => const AdminLoginScreen()),
        GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
        GoRoute(path: '/new-quote', builder: (context, state) => const NewQuoteScreen()),
        GoRoute(path: '/orders', builder: (context, state) => const OrdersScreen()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
        GoRoute(path: '/admin-quotes', builder: (context, state) => const AdminQuotesScreen()),
        GoRoute(
          path: '/admin-quote/:id',
          builder: (context, state) {
            final quoteId = state.pathParameters['id']!;
            return AdminQuoteDetailsScreen(quoteId: quoteId);
          },
        ),
        GoRoute(path: '/admin-production', builder: (context, state) => const ProductionQueueScreen()),
      ],
      redirect: (context, state) {
        final auth = context.read<AuthProvider>();
        final loggedIn = auth.isAuthenticated;
        final loggingIn = state.matchedLocation == '/login';

        if (!loggedIn && !loggingIn) return '/login';
        if (loggedIn && loggingIn) return '/home';
        return null;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'brcprint',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple), useMaterial3: true),
      routerConfig: _router,
    );
  }
}
