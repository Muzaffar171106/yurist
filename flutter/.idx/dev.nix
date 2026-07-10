{ pkgs, ... }: {
  channel = "stable-25.05";

  packages = [
    pkgs.flutter
    pkgs.jdk17
  ];

  idx = {
    extensions = [
      "Dart-Code.dart-code"
      "Dart-Code.flutter"
    ];

    previews = {
      enable = true;
      previews = {
        web = {
          command = [
            "flutter"
            "run"
            "-d"
            "web-server"
            "--web-hostname"
            "0.0.0.0"
            "--web-port"
            "$PORT"
            "--dart-define"
            "API_BASE_URL=http://127.0.0.1:5050"
          ];
          manager = "web";
        };
      };
    };
  };
}
