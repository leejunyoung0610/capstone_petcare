"""백엔드 → AI 서버 호출 시 내부 토큰 헤더 전송 여부."""

from app.core.config import settings
from tests.conftest import MINIMAL_JPEG


def _post_analyze(client, auth_headers, pet_id):
    return client.post(
        f"/api/diagnosis/analyze?pet_id={pet_id}",
        headers=auth_headers,
        files={"image": ("eye.jpg", MINIMAL_JPEG, "image/jpeg")},
    )


def test_ai_call_sends_internal_token_when_configured(
    client, auth_headers, test_pet, mock_ai_and_storage, monkeypatch,
):
    monkeypatch.setattr(settings, "AI_INTERNAL_TOKEN", "test-internal-token")
    resp = _post_analyze(client, auth_headers, test_pet.id)
    assert resp.status_code == 200
    headers = mock_ai_and_storage.post.call_args.kwargs["headers"]
    assert headers == {"X-Internal-Token": "test-internal-token"}


def test_ai_call_sends_no_token_header_when_unset(
    client, auth_headers, test_pet, mock_ai_and_storage, monkeypatch,
):
    monkeypatch.setattr(settings, "AI_INTERNAL_TOKEN", "")
    resp = _post_analyze(client, auth_headers, test_pet.id)
    assert resp.status_code == 200
    assert mock_ai_and_storage.post.call_args.kwargs["headers"] == {}
