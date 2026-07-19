#!/bin/sh
set -eu

secrets_dir=${1:-/mosquitto/secrets}
password_file="$secrets_dir/passwords"
temporary_file="$secrets_dir/.passwords.tmp"

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

[ -d "$secrets_dir" ] || fail 'MQTT secrets directory is unavailable'
[ "${MQTT_CONTROL_CENTER_USERNAME:-}" = 'control-center' ] || fail 'MQTT control-center username must be control-center'
[ -n "${MQTT_CONTROL_CENTER_PASSWORD:-}" ] || fail 'MQTT control-center password is required'
[ "${MQTT_GATEWAY_USERNAME:-}" = 'gateway' ] || fail 'MQTT gateway username must be gateway'
[ -n "${MQTT_GATEWAY_PASSWORD:-}" ] || fail 'MQTT gateway password is required'

cleanup() {
  rm -f "$temporary_file"
}

trap cleanup 0
trap 'exit 129' 1
trap 'exit 130' 2
trap 'exit 143' 15

umask 077
rm -f "$temporary_file"
mosquitto_passwd -b -c "$temporary_file" "$MQTT_CONTROL_CENTER_USERNAME" "$MQTT_CONTROL_CENTER_PASSWORD"
mosquitto_passwd -b "$temporary_file" "$MQTT_GATEWAY_USERNAME" "$MQTT_GATEWAY_PASSWORD"
chown 1883:1883 "$temporary_file"
chmod 0640 "$temporary_file"
mv -f "$temporary_file" "$password_file"
