"""멀티태스크 softmax 확장 — 공통 설정·라벨·추론 헬퍼."""

from __future__ import annotations

import os
from typing import Dict, List, Optional, Sequence, Tuple

import torch
import torch.nn.functional as F

from models.classifier.model_multitask_softmax import MultiTaskSoftmaxModel
from models.classifier.random_split_common import (
    RandomSplitConfig,
    active_disease_and_label,
    head_abnormal_probability,
    rank_diseases_by_abnormal_prob,
)

DISCRIM_KEY = MultiTaskSoftmaxModel.DISCRIM_KEY


class SoftmaxMultitaskConfig(RandomSplitConfig):
    """dog_best_multitask_softmax.pth 체크포인트."""

    BINARY_LOSS_WEIGHT = float(os.environ.get("BINARY_LOSS_WEIGHT", "1.0"))
    DISC_LOSS_WEIGHT = float(os.environ.get("DISC_LOSS_WEIGHT", "1.0"))
    INIT_FROM_CHECKPOINT = os.environ.get("INIT_FROM_CHECKPOINT", "auto").strip()

    @staticmethod
    def best_checkpoint(animal: str) -> str:
        return os.path.join(
            SoftmaxMultitaskConfig.OUTPUT_DIR,
            f"{animal}_best_multitask_softmax.pth",
        )

    @staticmethod
    def final_checkpoint(animal: str) -> str:
        return os.path.join(
            SoftmaxMultitaskConfig.OUTPUT_DIR,
            f"{animal}_final_multitask_softmax.pth",
        )


def discrimination_label_from_dict(
    label_dict: Dict[str, int],
    diseases: Sequence[str],
) -> int:
    """비정상 → 질환 index, 정상 → -1 (loss mask)."""
    for d in diseases:
        y = label_dict.get(d, -1)
        if y >= 0:
            if y > 0:
                return diseases.index(d)
            return -1
    return -1


def discrimination_label_from_batch(
    labels: Dict[str, torch.Tensor],
    sample_i: int,
    diseases: Sequence[str],
) -> int:
    for d in diseases:
        y = labels[d][sample_i].item()
        if y >= 0:
            if y > 0:
                return diseases.index(d)
            return -1
    return -1


def attach_discrimination_labels(
    labels: Dict[str, torch.Tensor],
    diseases: Sequence[str],
) -> Dict[str, torch.Tensor]:
    """배치 labels dict에 discrimination 텐서 추가 (in-place copy)."""
    bs = next(iter(labels.values())).size(0)
    disc = torch.full((bs,), -1, dtype=torch.long)
    for i in range(bs):
        disc[i] = discrimination_label_from_batch(labels, i, diseases)
    out = dict(labels)
    out[DISCRIM_KEY] = disc
    return out


def binary_gt_abnormal(labels: Dict[str, torch.Tensor], sample_i: int, diseases: Sequence[str]) -> bool:
    for d in diseases:
        y = labels[d][sample_i].item()
        if y >= 0:
            return y > 0
    return False


def binary_pred_abnormal(
    outputs: Dict[str, torch.Tensor],
    sample_i: int,
    diseases: Sequence[str],
    *,
    threshold: float = 0.5,
) -> bool:
    return any(head_abnormal_probability(outputs[d][sample_i]) >= threshold for d in diseases)


def softmax_discrimination_probs(
    outputs: Dict[str, torch.Tensor],
    sample_i: int,
    diseases: Sequence[str],
) -> Dict[str, float]:
    logits = outputs[DISCRIM_KEY][sample_i]
    probs = F.softmax(logits, dim=-1)
    return {d: float(probs[i].item()) for i, d in enumerate(diseases)}


def filter_abnormal_candidates(
    outputs: Dict[str, torch.Tensor],
    sample_i: int,
    diseases: Sequence[str],
    *,
    threshold: float = 0.5,
    min_candidates: int = 1,
) -> List[str]:
    """이진 헤드 P(비정상) >= threshold 인 질환 후보."""
    scored = [
        (d, head_abnormal_probability(outputs[d][sample_i]))
        for d in diseases
    ]
    scored.sort(key=lambda x: (-x[1], x[0]))
    cands = [d for d, p in scored if p >= threshold]
    if len(cands) < min_candidates:
        cands = [d for d, _ in scored[: min(min_candidates, len(scored))]]
    return cands


def rank_combined(
    outputs: Dict[str, torch.Tensor],
    sample_i: int,
    diseases: Sequence[str],
    *,
    mode: str = "product",
    candidate_threshold: float = 0.5,
) -> List[Tuple[str, float]]:
    """후보 필터 + 감별/결합 순위.

    mode:
      - binary: 기존 P(비정상) 순위
      - disc: 후보 내 softmax 감별 점수 (renormalize)
      - product: P(비정상) * P(disc|d)
    """
    disc_probs = softmax_discrimination_probs(outputs, sample_i, diseases)
    cands = filter_abnormal_candidates(
        outputs, sample_i, diseases, threshold=candidate_threshold,
    )

    if mode == "binary":
        return rank_diseases_by_abnormal_prob(outputs, sample_i, diseases)

    scored: List[Tuple[str, float]] = []
    for d in cands:
        p_abn = head_abnormal_probability(outputs[d][sample_i])
        p_disc = disc_probs[d]
        if mode == "disc":
            score = p_disc
        elif mode == "product":
            score = p_abn * p_disc
        else:
            raise ValueError(f"Unknown rank mode: {mode}")
        scored.append((d, score))

    if mode == "disc" and scored:
        total = sum(s for _, s in scored)
        if total > 0:
            scored = [(d, s / total) for d, s in scored]

    scored.sort(key=lambda x: (-x[1], x[0]))
    return scored


def topk_hit(ranked_names: List[str], target: str, k: int) -> bool:
    return target in ranked_names[:k]
