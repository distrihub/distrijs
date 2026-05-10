#!/usr/bin/env bash
# Convenience wrapper that delegates to the distri repo's start script.
# Lets you run `pnpm -F @distri/integration start-server` if you've
# checked out distri at ../../distri.
set -euo pipefail
DISTRI_REPO="${DISTRI_REPO:-$(cd "$(dirname "$0")/../../../distri" && pwd)}"
if [[ ! -d "${DISTRI_REPO}" ]]; then
  echo "Set DISTRI_REPO to the distri checkout (looked at ${DISTRI_REPO})"
  exit 1
fi
exec bash "${DISTRI_REPO}/integration/scripts/start_mock_server.sh" "${1:-}"
