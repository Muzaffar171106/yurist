class AppConfig {
  const AppConfig._();
  static const appName = 'Yurist AI';
  static const jurisdiction = "O'zbekiston Respublikasi";
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://44.198.184.58',
  );
}
