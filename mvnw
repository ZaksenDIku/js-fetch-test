#!/bin/sh
# Minimal checked-download Maven bootstrapper for Java 21 exam lab.
# If Maven is installed, reuse it; otherwise download Apache Maven 3.9.11.
set -eu
if command -v mvn >/dev/null 2>&1; then
  exec mvn "$@"
fi
VERSION=3.9.11
DEST="$HOME/.m2/wrapper/dists/apache-maven-$VERSION-zak"
if [ ! -x "$DEST/bin/mvn" ]; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl mangler; installer Maven med: brew install maven" >&2
    exit 1
  fi
  TMP=$(mktemp -d)
  trap 'rm -rf "$TMP"' EXIT HUP INT TERM
  BASE="https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$VERSION/apache-maven-$VERSION-bin.tar.gz"
  echo "Henter Apache Maven $VERSION (første start)..." >&2
  curl --fail --silent --show-error --location "$BASE" -o "$TMP/maven.tar.gz"
  curl --fail --silent --show-error --location "$BASE.sha512" -o "$TMP/expected.sha512"
  EXPECTED=$(tr -d '\r\n ' < "$TMP/expected.sha512" | cut -c1-128)
  if command -v shasum >/dev/null 2>&1; then
    ACTUAL=$(shasum -a 512 "$TMP/maven.tar.gz" | awk '{print $1}')
  elif command -v sha512sum >/dev/null 2>&1; then
    ACTUAL=$(sha512sum "$TMP/maven.tar.gz" | awk '{print $1}')
  else
    echo "SHA-512-værktøj mangler: installér Maven manuelt." >&2
    exit 1
  fi
  if [ "$EXPECTED" != "$ACTUAL" ]; then
    echo "Maven-download fejlede SHA-512-kontrol." >&2
    exit 1
  fi
  tar -xzf "$TMP/maven.tar.gz" -C "$TMP"
  mkdir -p "$(dirname "$DEST")"
  mv "$TMP/apache-maven-$VERSION" "$DEST"
fi
exec "$DEST/bin/mvn" "$@"
