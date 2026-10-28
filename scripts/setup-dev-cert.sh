#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cert_dir="$repo_root/.certs"

mkdir -p "$cert_dir"
chmod 700 "$cert_dir"

if [[ "$(uname -s)" == Linux ]]; then
	trust_dir="$HOME/.aspnet/dev-certs/trust"
	mkdir -p "$trust_dir"
	export SSL_CERT_DIR="${SSL_CERT_DIR:+$SSL_CERT_DIR:}$trust_dir:/etc/ssl/certs"
fi

dotnet dev-certs https --trust
dotnet dev-certs https --export-path "$cert_dir/localhost.pem" --format Pem --no-password

chmod 644 "$cert_dir/localhost.pem"
chmod 600 "$cert_dir/localhost.key"

printf 'Development certificate exported to %s\n' "$cert_dir"