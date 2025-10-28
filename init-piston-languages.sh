#!/bin/bash
set -e

PISTON_URL="http://localhost:2000"

languages=(
    "python:*"
    "node:*"
    "java:*"
    "gcc:*"
    "go:*"
    "rust:*"
    "typescript:*"
    "php:*"
    "ruby:*"
    "mono:*"
    "swift:*"
    "kotlin:*"
)

install_language() {
    local lang_spec=$1
    local name=$(echo $lang_spec | cut -d':' -f1)
    local version=$(echo $lang_spec | cut -d':' -f2)

    echo "Installing $name version $version..."

    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "${PISTON_URL}/api/v2/packages" \
        -H "Content-Type: application/json" \
        -d "{\"language\": \"${name}\", \"version\": \"${version}\"}")

    if [ "$http_code" -eq 200 ]; then
        echo "Successfully requested installation for $name"
    else
        echo "Error requesting installation for $name (HTTP Status: $http_code)"
    fi
    sleep 1
}

echo "Waiting for Piston API to start..."
until curl -s -o /dev/null "${PISTON_URL}/api/v2/runtimes"; do
    echo "Waiting..."
    sleep 3
done
echo "Piston API is ready."

for lang in "${languages[@]}"; do
    install_language "$lang"
done

echo "Language installation requests finished."
echo "Final list of installed runtimes:"
curl -s "${PISTON_URL}/api/v2/runtimes" | python3 -m json.tool