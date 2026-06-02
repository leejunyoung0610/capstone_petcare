from __future__ import annotations

import os
from typing import Dict, List, Optional, Sequence, Tuple

import torch
import torch.nn.functional as F

from models.classifier.dataset_random_split import (
    MEDICAL_DEVICES,
    SMARTPHONE,
    resolve_cap_mode,
)
from models.classifier.train import Config as BaseTrainConfig

TOP_KS = (1, 2, 3, 5)


class RandomSplitConfig(BaseTrainConfig):
    ANIMAL_TYPE = os.environ.get("ANIMAL_TYPE", "dog").strip().lower()
    SPLIT_SEED = int(os.environ.get("SPLIT_SEED", "42"))
    VAL_RATIO = float(os.environ.get("VAL_RATIO", "0.2"))
    USE_GROUP_SPLIT = os.environ.get("USE_GROUP_SPLIT", "1").strip().lower() in (
        "1",
        "true",
        "yes",
    )
    CAP_MODE = resolve_cap_mode()

    @staticmethod
    def _checkpoint_suffix() -> str:
        if resolve_cap_mode() == "disease_balanced":
            return "balanced_cap"
        return "random_split"

    @staticmethod
    def best_checkpoint(animal: str) -> str:
        suffix = RandomSplitConfig._checkpoint_suffix()
        return os.path.join(
            RandomSplitConfig.OUTPUT_DIR,
            f"{animal}_best_{suffix}.pth",
        )

    @staticmethod
    def final_checkpoint(animal: str) -> str:
        suffix = RandomSplitConfig._checkpoint_suffix()
        return os.path.join(
            RandomSplitConfig.OUTPUT_DIR,
            f"{animal}_final_{suffix}.pth",
        )


def head_abnormal_probability(logits: torch.Tensor) -> float:
    """헤드별 P(비정상) = 1 - P(클래스 0=무)."""
    probs = F.softmax(logits, dim=-1)
    return (1.0 - probs[0]).item()


def active_disease_and_label(
    labels: Dict[str, torch.Tensor],
    sample_i: int,
    diseases: Sequence[str],
) -> Tuple[Optional[str], int]:
    for d in diseases:
        y = labels[d][sample_i].item()
        if y >= 0:
            return d, y
    return None, -1


def rank_diseases_by_abnormal_prob(
    outputs: Dict[str, torch.Tensor],
    sample_i: int,
    diseases: Sequence[str],
    disease_weights: Optional[Dict[str, float]] = None,
    exclude_heads: Optional[frozenset[str]] = None,
) -> List[Tuple[str, float]]:
    weights = disease_weights or {}
    excluded = exclude_heads or frozenset()
    scored = []
    for d in diseases:
        if d in excluded:
            continue
        prob = head_abnormal_probability(outputs[d][sample_i])
        w = weights.get(d, 1.0)
        scored.append((d, prob * w))
    scored.sort(key=lambda x: (-x[1], x[0]))
    return scored


def device_bucket(device_name: str) -> str:
    if device_name == SMARTPHONE:
        return SMARTPHONE
    if device_name in MEDICAL_DEVICES:
        return "medical"
    return "other"
