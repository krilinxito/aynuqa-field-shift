import base64
import hashlib
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def _base64url(number: int) -> str:
    size = (number.bit_length() + 7) // 8
    return base64.urlsafe_b64encode(number.to_bytes(size, "big")).rstrip(b"=").decode()


def _load_or_create_key(key_path: Path | None) -> rsa.RSAPrivateKey:
    """Clave de firma estable: si cambia, PowerSync rechaza los tokens (KID)
    hasta reiniciarse. Se guarda en el volumen de datos del backend."""
    if key_path and key_path.exists():
        key = serialization.load_pem_private_key(key_path.read_bytes(), password=None)
        if isinstance(key, rsa.RSAPrivateKey):
            return key
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    if key_path:
        try:
            key_path.parent.mkdir(parents=True, exist_ok=True)
            key_path.write_bytes(
                key.private_bytes(
                    serialization.Encoding.PEM,
                    serialization.PrivateFormat.PKCS8,
                    serialization.NoEncryption(),
                )
            )
        except OSError:
            pass
    return key


class TokenIssuer:
    """Clave de desarrollo guardada en disco; en produccion debe inyectarse desde un gestor de secretos."""

    def __init__(
        self, audience: str, lifetime_minutes: int, key_path: Path | None = None
    ) -> None:
        self._private_key = _load_or_create_key(key_path)
        self._audience = audience
        self._lifetime = timedelta(minutes=lifetime_minutes)
        public_der = self._private_key.public_key().public_bytes(
            serialization.Encoding.DER,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        self._kid = base64.urlsafe_b64encode(hashlib.sha256(public_der).digest()[:12]).rstrip(b"=").decode()

    def issue(self, subject: str = "community-reader") -> tuple[str, datetime]:
        now = datetime.now(timezone.utc)
        expires_at = now + self._lifetime
        token = jwt.encode(
            {
                "sub": subject,
                "aud": self._audience,
                "iat": now,
                "exp": expires_at,
            },
            self._private_key,
            algorithm="RS256",
            headers={"kid": self._kid},
        )
        return token, expires_at

    def verify(self, token: str) -> bool:
        """True si el token lo firmó esta API y no venció."""
        try:
            jwt.decode(
                token,
                self._private_key.public_key(),
                algorithms=["RS256"],
                audience=self._audience,
            )
        except jwt.PyJWTError:
            return False
        return True

    def jwks(self) -> dict:
        numbers = self._private_key.public_key().public_numbers()
        return {
            "keys": [
                {
                    "kty": "RSA",
                    "use": "sig",
                    "alg": "RS256",
                    "kid": self._kid,
                    "n": _base64url(numbers.n),
                    "e": _base64url(numbers.e),
                }
            ]
        }
