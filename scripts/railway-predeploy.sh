#!/bin/sh
set -e

cd /app

attempt=1
max_attempts=3

while [ "$attempt" -le "$max_attempts" ]; do
  echo "Running database migrate (attempt $attempt/$max_attempts)..."
  if dotnet Optimus.Api.dll --migrate-only; then
    echo "Database migrate completed."
    exit 0
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    echo "Database migrate failed after $max_attempts attempts."
    exit 1
  fi

  echo "Retrying in 10s..."
  sleep 10
  attempt=$((attempt + 1))
done
