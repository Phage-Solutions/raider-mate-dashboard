#!/bin/sh
# Two processes in one container, because a Serverless Container is one container.
#
# Neither half is useful alone: Caddy without the node process serves 502s, and the node
# process without Caddy is not reachable, since it listens on loopback only. So whichever
# exits first takes the container with it, and the platform replaces the whole thing
# rather than leaving a healthy-looking container that answers nothing.
set -eu

node /app/dist/server/entry.mjs &
node_pid=$!

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
caddy_pid=$!

# 143 is what a process killed by SIGTERM reports, which is what the platform sent us.
trap 'kill -TERM "$node_pid" "$caddy_pid" 2>/dev/null || true; exit 143' INT TERM

# Polled rather than `wait -n`. Busybox's builtin does not return here when a background
# child is killed, which left a container serving 502s from the half of itself that was
# still alive: exactly the failure this loop exists to catch.
while kill -0 "$node_pid" 2>/dev/null && kill -0 "$caddy_pid" 2>/dev/null; do
	sleep 1
done

echo "docker-entrypoint: half the container died, taking the rest with it" >&2
kill -TERM "$node_pid" "$caddy_pid" 2>/dev/null || true
exit 1
