#!/usr/bin/env sh
set -eu

# Standard entrypoint for checkup360-cms container.
#
# Subcommands:
#   serve            Start the standalone Next.js server (default).
#   <anything else>  Exec it as-is (e.g. bash, sh, command overrides).

cmd="${1:-serve}"
shift || true

case "$cmd" in
  serve)
    echo "[entrypoint] starting standalone next.js server on 0.0.0.0:${PORT:-3000}..."
    exec node server.js "$@"
    ;;
  *)
    exec "$cmd" "$@"
    ;;
esac
