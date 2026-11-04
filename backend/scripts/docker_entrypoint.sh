#!/bin/sh
set -e

echo "[entrypoint] Esperando Postgres y aplicando migraciones..."
python -m scripts.migrate

echo "[entrypoint] Seed de municipios/decretos de prueba..."
python -m scripts.seed_pruebas

echo "[entrypoint] Seed de usuarios demo..."
python -m scripts.seed_demo_usuarios

echo "[entrypoint] Arrancando API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
