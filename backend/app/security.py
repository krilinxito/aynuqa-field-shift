import base64
import hashlib
from datetime import datetime, timedelta, timezone

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def _base64url(number: int) -> str:
    size = (number.bit_length() + 7) // 8
    return base64.urlsafe_b64encode(number.to_bytes(size, "big")).rstrip(b"=").decode()


class TokenIssuer:
    """Clave efimera de desarrollo; en produccion debe inyectarse desde un gestor de secretos."""

    def __init__(self, audience: str, lifetime_minutes: int) -> None:
        self._private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
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
