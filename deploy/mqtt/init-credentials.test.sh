#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
sandbox=$(mktemp -d)
trap 'rm -rf "$sandbox"' EXIT HUP INT TERM

secrets_dir="$sandbox/secrets"
fake_bin="$sandbox/bin"
mkdir -p "$secrets_dir" "$fake_bin"

cat > "$fake_bin/mosquitto_passwd" <<'EOF'
#!/bin/sh
set -eu

if [ "$1" != "-b" ]; then
  exit 90
fi

if [ "$2" = "-c" ]; then
  printf '%s:%s\n' "$4" "$5" > "$3"
  exit 0
fi

if [ "${FAIL_GATEWAY_WRITE:-}" = "1" ]; then
  exit 42
fi

printf '%s:%s\n' "$3" "$4" >> "$2"
EOF

cat > "$fake_bin/chown" <<'EOF'
#!/bin/sh
set -eu
test "$1" = '1883:1883'
test "$(basename -- "$2")" = '.passwords.tmp'
EOF

cat > "$fake_bin/chmod" <<'EOF'
#!/bin/sh
set -eu
test "$1" = '0640'
test "$(basename -- "$2")" = '.passwords.tmp'
EOF

chmod +x "$fake_bin/mosquitto_passwd" "$fake_bin/chown" "$fake_bin/chmod"

printf 'previous-password-file\n' > "$secrets_dir/passwords"

if PATH="$fake_bin:$PATH" \
  FAIL_GATEWAY_WRITE=1 \
  MQTT_CONTROL_CENTER_USERNAME=control-center \
  MQTT_CONTROL_CENTER_PASSWORD=control-password \
  MQTT_GATEWAY_USERNAME=gateway \
  MQTT_GATEWAY_PASSWORD=gateway-password \
  sh "$script_dir/init-credentials.sh" "$secrets_dir"; then
  echo 'expected second-user failure' >&2
  exit 1
fi

test "$(cat "$secrets_dir/passwords")" = 'previous-password-file'
test ! -e "$secrets_dir/.passwords.tmp"

if PATH="$fake_bin:$PATH" \
  MQTT_CONTROL_CENTER_USERNAME=unexpected-user \
  MQTT_CONTROL_CENTER_PASSWORD=control-password \
  MQTT_GATEWAY_USERNAME=gateway \
  MQTT_GATEWAY_PASSWORD=gateway-password \
  sh "$script_dir/init-credentials.sh" "$secrets_dir"; then
  echo 'expected fixed-identity validation failure' >&2
  exit 1
fi

test "$(cat "$secrets_dir/passwords")" = 'previous-password-file'

if PATH="$fake_bin:$PATH" \
  MQTT_CONTROL_CENTER_USERNAME=control-center \
  MQTT_CONTROL_CENTER_PASSWORD=control-password \
  MQTT_GATEWAY_USERNAME=gateway \
  MQTT_GATEWAY_PASSWORD= \
  sh "$script_dir/init-credentials.sh" "$secrets_dir"; then
  echo 'expected empty-password validation failure' >&2
  exit 1
fi

test "$(cat "$secrets_dir/passwords")" = 'previous-password-file'

PATH="$fake_bin:$PATH" \
  MQTT_CONTROL_CENTER_USERNAME=control-center \
  MQTT_CONTROL_CENTER_PASSWORD=control-password \
  MQTT_GATEWAY_USERNAME=gateway \
  MQTT_GATEWAY_PASSWORD=gateway-password \
  sh "$script_dir/init-credentials.sh" "$secrets_dir"

expected=$(printf 'control-center:control-password\ngateway:gateway-password')
test "$(cat "$secrets_dir/passwords")" = "$expected"
test ! -e "$secrets_dir/.passwords.tmp"

printf 'credential init atomicity checks passed\n'
