import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yurist_ai_flutter/core/widgets/brand_header.dart';

void main() {
  testWidgets('Brand header renders Yurist AI title', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: BrandHeader())),
    );

    expect(find.text('Yurist AI'), findsOneWidget);
    expect(find.text("O'zbekiston huquqi"), findsOneWidget);
  });
}
