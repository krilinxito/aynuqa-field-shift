from __future__ import annotations

import json
import uuid

from tests.conftest import CONTRACTS_DIR, assert_schema

EXAMPLE = json.loads(
    (CONTRACTS_DIR / "examples" / "api" / "decision.json").read_text(encoding="utf-8")
)


def _auth(client) -> dict[str, str]:
    token = client.get("/api/powersync/token").json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_put_list_and_delete_decision(client) -> None:
    headers = _auth(client)
    decision = {**EXAMPLE, "id": str(uuid.uuid4())}

    saved = client.put(f"/api/decisions/{decision['id']}", json=decision, headers=headers)
    assert saved.status_code == 200
    assert_schema(saved.json(), "decision")

    listed = client.get("/api/decisions", params={"community_id": "pumani"}).json()
    assert [d["id"] for d in listed["decisions"]] == [decision["id"]]
    assert listed["decisions"][0]["follows_recommendation"] is True

    # Reemplazar: la comunidad puede cambiar de opinión.
    changed = {**decision, "action": "open", "follows_recommendation": False}
    assert client.put(f"/api/decisions/{decision['id']}", json=changed, headers=headers).status_code == 200
    listed = client.get(
        "/api/decisions", params={"community_id": "pumani", "sector_id": "S4"}
    ).json()
    assert listed["decisions"][0]["action"] == "open"

    assert client.delete(f"/api/decisions/{decision['id']}", headers=headers).status_code == 204
    assert client.get("/api/decisions", params={"community_id": "pumani"}).json() == {
        "decisions": []
    }


def test_decision_requires_token(client) -> None:
    response = client.put(f"/api/decisions/{EXAMPLE['id']}", json=EXAMPLE)
    assert response.status_code == 401
    bad = client.put(
        f"/api/decisions/{EXAMPLE['id']}",
        json=EXAMPLE,
        headers={"Authorization": "Bearer inventado"},
    )
    assert bad.status_code == 401


def test_decision_is_validated_against_contract(client) -> None:
    headers = _auth(client)
    bad = {**EXAMPLE, "action": "vender"}
    response = client.put(f"/api/decisions/{EXAMPLE['id']}", json=bad, headers=headers)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"

    other_id = str(uuid.uuid4())
    response = client.put(f"/api/decisions/{other_id}", json=EXAMPLE, headers=headers)
    assert response.status_code == 422
