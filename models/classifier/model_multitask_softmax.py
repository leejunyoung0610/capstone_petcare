"""
EfficientNet-B3 멀티태스크 + 10-class 질환 감별 softmax 헤드.

- Head A: 질환별 독립 분류 헤드 (기존 MultiTaskEyeDiseaseModel)
- Head B: discrimination — 10-class softmax (비정상 샘플만 CE)
"""

from __future__ import annotations

from typing import Dict, List, Optional

import torch
import torch.nn as nn

from models.classifier.model import (
    CAT_DISEASE_HEADS,
    CAT_LABEL_MAP,
    DOG_DISEASE_HEADS,
    DOG_LABEL_MAP,
    MultiTaskEyeDiseaseModel,
    count_parameters,
)


class MultiTaskSoftmaxModel(MultiTaskEyeDiseaseModel):
    """공유 백본 + per-disease 헤드 + 질환 감별 softmax 헤드."""

    DISCRIM_KEY = "discrimination"

    def __init__(
        self,
        animal_type: str = "dog",
        pretrained: bool = True,
        *,
        head_dropout: float = 0.3,
    ):
        super().__init__(animal_type=animal_type, pretrained=pretrained)
        head_dropout = float(max(0.2, min(0.5, head_dropout)))
        head_dropout2 = float(max(0.2, min(0.5, head_dropout + 0.1)))
        num_diseases = len(self.disease_heads)

        self.discrimination_classifier = nn.Sequential(
            nn.Dropout(head_dropout),
            nn.Linear(self.feature_dim, 512),
            nn.ReLU(),
            nn.Dropout(head_dropout2),
            nn.Linear(512, num_diseases),
        )

        self.disease_to_disc_idx = {d: i for i, d in enumerate(self.get_disease_names())}
        print(f"  - 감별 헤드: {num_diseases}-class softmax (Head B)")

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        features = self.backbone(x)
        outputs: Dict[str, torch.Tensor] = {}
        for disease, classifier in self.classifiers.items():
            outputs[disease] = classifier(features)
        outputs[self.DISCRIM_KEY] = self.discrimination_classifier(features)
        return outputs

    def get_discrimination_index(self, disease: str) -> int:
        return self.disease_to_disc_idx[disease]


def create_multitask_softmax_model(
    animal_type: str = "dog",
    pretrained: bool = True,
    *,
    head_dropout: float = 0.4,
) -> MultiTaskSoftmaxModel:
    return MultiTaskSoftmaxModel(
        animal_type=animal_type,
        pretrained=pretrained,
        head_dropout=head_dropout,
    )


def load_partial_checkpoint(
    model: MultiTaskSoftmaxModel,
    checkpoint_path: str,
    device: torch.device | str,
) -> dict:
    """기존 멀티태스크 체크포인트 → 백본+per-disease 헤드만 로드 (감별 헤드는 random init)."""
    from models.classifier.inference_multitask import extract_state_dict

    ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)
    state = extract_state_dict(ckpt)
    missing, unexpected = model.load_state_dict(state, strict=False)
    disc_missing = [k for k in missing if k.startswith("discrimination_classifier")]
    other_missing = [k for k in missing if not k.startswith("discrimination_classifier")]
    print(f"✓ Partial load: {checkpoint_path}")
    if other_missing:
        print(f"  ⚠ missing (non-disc): {other_missing[:5]}{'…' if len(other_missing) > 5 else ''}")
    if unexpected:
        print(f"  ⚠ unexpected: {unexpected[:5]}{'…' if len(unexpected) > 5 else ''}")
    print(f"  discrimination head: random init ({len(disc_missing)} new params)")
    return ckpt


if __name__ == "__main__":
    import sys
    from pathlib import Path

    _root = Path(__file__).resolve().parents[2]
    if str(_root) not in sys.path:
        sys.path.insert(0, str(_root))

    print("=" * 60)
    m = create_multitask_softmax_model("dog", pretrained=False)
    x = torch.randn(2, 3, 300, 300)
    out = m(x)
    print(f"params: {count_parameters(m):,}")
    for k, v in out.items():
        print(f"  {k}: {tuple(v.shape)}")
