"""US-004.1: acceso al panel admin solo con JWT + rol admin."""

from __future__ import annotations

import inspect

import pytest

from app.core.deps import require_admin
from app.core.exceptions import ForbiddenError
from app.models.usuario import RolUsuario, Usuario
from app.routers import admin as admin_router
from app.schemas.usuario import UsuarioCreate
from app.services.auth_service import AuthService


def _usuario(rol: RolUsuario) -> Usuario:
    return Usuario(
        id=1,
        email="prueba@porahino.co",
        password_hash="hash",
        rol=rol,
        is_active=True,
    )


@pytest.mark.asyncio
async def test_require_admin_acepta_rol_admin() -> None:
    admin = _usuario(RolUsuario.ADMIN)
    assert await require_admin(usuario=admin) is admin


@pytest.mark.asyncio
async def test_require_admin_rechaza_conductor_con_403() -> None:
    conductor = _usuario(RolUsuario.CONDUCTOR)
    with pytest.raises(ForbiddenError) as exc:
        await require_admin(usuario=conductor)
    assert exc.value.status_code == 403
    assert "administrador" in exc.value.message.lower()


def test_todos_los_endpoints_admin_exigen_require_admin() -> None:
    for route in admin_router.router.routes:
        dependencias = getattr(route, "dependant", None)
        assert dependencias is not None
        nombres = {dep.call.__name__ for dep in dependencias.dependencies if dep.call}
        assert "require_admin" in nombres, f"{route.path} no usa require_admin"


def test_registro_publico_no_acepta_rol_en_schema() -> None:
    assert "rol" not in UsuarioCreate.model_fields


@pytest.mark.asyncio
async def test_register_siempre_crea_conductor(monkeypatch: pytest.MonkeyPatch) -> None:
    from unittest.mock import AsyncMock, MagicMock

    monkeypatch.setattr(
        "app.services.auth_service.get_password_hash", lambda _password: "hash-fijo"
    )

    db = AsyncMock()
    db.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: None))
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    await AuthService(db).register(
        UsuarioCreate(email="nuevo@porahino.co", password="clave1234")
    )
    creado = db.add.call_args[0][0]
    assert isinstance(creado, Usuario)
    assert creado.rol == RolUsuario.CONDUCTOR


def test_registro_rechaza_campo_rol() -> None:
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        UsuarioCreate(email="a@b.co", password="clave1234", rol="admin")  # type: ignore[call-arg]


def test_require_admin_esta_documentado_en_deps() -> None:
    source = inspect.getsource(require_admin)
    assert "RolUsuario.ADMIN" in source
    assert "ForbiddenError" in source
