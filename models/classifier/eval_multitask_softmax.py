"""
멀티태스크+softmax vs balanced cap baseline 직접 비교.

실행 (프로젝트 루트):
  CAP_MODE=disease_balanced PRESERVE_SMARTPHONE=true SPLIT_SEED=42 \\
    ANIMAL_TYPE=dog python models/classifier/eval_multitask_softmax.py

환경변수:
  BASELINE_CKPT=  — dog_best_balanced_cap.pth (기본)
  SOFTMAX_CKPT=   — dog_best_multitask_softmax.pth (기본)
  RUN_CP=1        — Conformal Prediction (analyze_confusion_and_cp Part B)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from tqdm import tqdm

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from models.classifier.dataset_random_split import (
    SMARTPHONE,
    RandomSplitEyeDataset,
    create_random_split_dataloaders,
)
from models.classifier.inference_multitask import extract_state_dict
from models.classifier.model import create_model
from models.classifier.model_multitask_softmax import MultiTaskSoftmaxModel, create_multitask_softmax_model
from models.classifier.multitask_softmax_common import (
    DISCRIM_KEY,
    SoftmaxMultitaskConfig,
    binary_gt_abnormal,
    binary_pred_abnormal,
    rank_combined,
    topk_hit,
)
from models.classifier.random_split_common import (
    RandomSplitConfig,
    TOP_KS,
    active_disease_and_label,
    rank_diseases_by_abnormal_prob,
)
from models.classifier.train import get_device, resolve_batch_size, resolve_num_workers
from models.classifier.train_random_split import evaluate_device_subsets


def _load_model(path: Path, animal: str, device: str, *, softmax: bool) -> nn.Module:
    if softmax:
        model = create_multitask_softmax_model(animal, pretrained=False)
    else:
        model = create_model(animal, pretrained=False)
    ckpt = torch.load(path, map_location=device, weights_only=False)
    model.load_state_dict(extract_state_dict(ckpt), strict=not softmax)
    model.to(device)
    model.eval()
    return model


@torch.no_grad()
def evaluate_model(
    model: nn.Module,
    val_ds: RandomSplitEyeDataset,
    val_loader: DataLoader,
    diseases: List[str],
    device: str,
    *,
    is_softmax: bool = False,
) -> dict:
    model.eval()
    binary_ok = binary_total = 0
    abn_total = 0
    modes = ["binary", "disc", "product"] if is_softmax else ["binary"]
    topk_hits = {m: {k: 0 for k in TOP_KS} for m in modes}
    per_disease = {d: {m: {k: 0 for k in TOP_KS} for m in modes} for d in diseases}
    per_disease_n = defaultdict(int)

    local_idx = 0
    for images, labels in tqdm(val_loader, desc="Eval"):
        images = images.to(device)
        outputs = model(images)
        bs = images.size(0)

        for i in range(bs):
            if local_idx >= len(val_ds):
                break
            gt_d, gt_y = active_disease_and_label(labels, i, diseases)
            binary_total += 1
            gt_abn = binary_gt_abnormal(labels, i, diseases)
            if binary_pred_abnormal(outputs, i, diseases) == gt_abn:
                binary_ok += 1

            if gt_y <= 0 or gt_d is None:
                local_idx += 1
                continue

            abn_total += 1
            per_disease_n[gt_d] += 1

            for mode in modes:
                if mode == "binary":
                    ranked = rank_diseases_by_abnormal_prob(outputs, i, diseases)
                else:
                    ranked = rank_combined(outputs, i, diseases, mode=mode)
                names = [d for d, _ in ranked]
                for k in TOP_KS:
                    if topk_hit(names, gt_d, k):
                        topk_hits[mode][k] += 1
                        per_disease[gt_d][mode][k] += 1

            local_idx += 1

    report = {
        "binary_acc": binary_ok / binary_total if binary_total else 0.0,
        "binary_total": binary_total,
        "abnormal_n": abn_total,
        "topk": {},
        "per_disease_top1": {},
    }
    for mode in modes:
        report["topk"][mode] = {
            f"top_{k}": topk_hits[mode][k] / abn_total if abn_total else 0.0
            for k in TOP_KS
        }
    for d in diseases:
        n = per_disease_n[d]
        if n == 0:
            continue
        report["per_disease_top1"][d] = {
            mode: {f"top_{k}": per_disease[d][mode][k] / n for k in TOP_KS}
            for mode in modes
        }

    device_report = evaluate_device_subsets(model, val_ds, val_loader, diseases, device)
    report["device"] = device_report
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--animal", default=os.environ.get("ANIMAL_TYPE", "dog"))
    parser.add_argument("--device", default=None)
    parser.add_argument("--batch-size", type=int, default=None)
    parser.add_argument("--run-cp", action="store_true")
    args = parser.parse_args()

    animal = args.animal.lower()
    device = args.device or get_device()
    batch_size = args.batch_size or resolve_batch_size(32)

    baseline_path = Path(
        os.environ.get("BASELINE_CKPT", RandomSplitConfig.best_checkpoint(animal))
    )
    softmax_path = Path(
        os.environ.get("SOFTMAX_CKPT", SoftmaxMultitaskConfig.best_checkpoint(animal))
    )

    print("=" * 72)
    print(f"Multitask+Softmax vs Baseline — {animal.upper()}")
    print(f"  baseline: {baseline_path}")
    print(f"  softmax:  {softmax_path}")
    print("=" * 72)

    _, val_loader, _, val_ds, split_meta = create_random_split_dataloaders(
        animal, batch_size=batch_size, img_size=300,
        num_workers=resolve_num_workers(device), use_sampler=False,
    )
    diseases = val_ds.diseases

    results = {"animal": animal, "split_meta": split_meta, "models": {}}

    if baseline_path.is_file():
        print(f"\n>>> Baseline: {baseline_path.name}")
        bl_model = _load_model(baseline_path, animal, device, softmax=False)
        results["models"]["baseline_balanced_cap"] = evaluate_model(
            bl_model, val_ds, val_loader, diseases, device, is_softmax=False,
        )
        _print_report(results["models"]["baseline_balanced_cap"], ["binary"])
    else:
        print(f"⚠ baseline 없음: {baseline_path}")

    if softmax_path.is_file():
        print(f"\n>>> Softmax multitask: {softmax_path.name}")
        sm_model = _load_model(softmax_path, animal, device, softmax=True)
        results["models"]["multitask_softmax"] = evaluate_model(
            sm_model, val_ds, val_loader, diseases, device, is_softmax=True,
        )
        _print_report(results["models"]["multitask_softmax"], ["binary", "disc", "product"])
    else:
        print(f"⚠ softmax ckpt 없음: {softmax_path} — train_multitask_softmax.py 먼저 실행")

    run_cp = args.run_cp or os.environ.get("RUN_CP", "").strip() in ("1", "true", "yes")
    if run_cp and softmax_path.is_file():
        print("\n>>> Conformal Prediction — 별도 실행:")
        print(f"  CHECKPOINT={softmax_path} ANIMAL_TYPE={animal} \\")
        print(f"    python models/classifier/analyze_confusion_and_cp.py")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = Path("models/classifier/eval_results") / f"multitask_softmax_compare_{animal}_{ts}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n✓ JSON: {out}")


def _print_report(report: dict, modes: List[str]) -> None:
    print(f"  binary_acc: {report['binary_acc'] * 100:.2f}%  (n={report['binary_total']:,})")
    print(f"  abnormal eval n: {report['abnormal_n']:,}")
    for mode in modes:
        tk = report["topk"].get(mode, {})
        parts = "  ".join(f"Top-{k}={tk.get(f'top_{k}', 0) * 100:.2f}%" for k in (1, 3) if f"top_{k}" in tk)
        print(f"  [{mode}] {parts}")
    dep = report.get("device", {}).get("device_dependency_score", 0)
    print(f"  device dependency (max-min): {dep * 100:.2f}%p")


if __name__ == "__main__":
    main()
