from passlib.context import CryptContext

# NOTE:
# bcrypt backend in some Python/Windows envs can fail due to passlib+bcrypt
# compatibility issues. pbkdf2_sha256 is stable for this lab setup.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

