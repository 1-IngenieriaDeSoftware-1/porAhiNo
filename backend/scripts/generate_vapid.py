"""Genera par VAPID para Web Push (MainV2). Imprime vars para .env."""

from __future__ import annotations

import base64
import sys

try:
    from cryptography.hazmat.primitives.asymmetric import ec
except ImportError:
    print("Falta cryptography (viene con python-jose).", file=sys.stderr)
    sys.exit(1)


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def main() -> None:
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    priv_nums = private_key.private_numbers()
    pub_nums = public_key.public_numbers()
    # Clave privada: 32 bytes big-endian
    priv_bytes = priv_nums.private_value.to_bytes(32, "big")
    # Clave pública uncompressed: 0x04 || X || Y
    x = pub_nums.x.to_bytes(32, "big")
    y = pub_nums.y.to_bytes(32, "big")
    pub_bytes = b"\x04" + x + y
    print("# Pega en backend/.env")
    print(f"VAPID_PUBLIC_KEY={b64url(pub_bytes)}")
    print(f"VAPID_PRIVATE_KEY={b64url(priv_bytes)}")
    print("VAPID_SUBJECT=mailto:admin@porahino.co")


if __name__ == "__main__":
    main()
