"""
멀티태스크+softmax vs balanced cap baseline 직접 비교.

실행 (프로젝트 루트):
  CAP_MODE=disease_balanced PRESERVE_SMARTPHONE=true SPLIT_SEED=42 \\
    ANIMAL_TYPE=dog python models/classifier/eval_multitask_softmax.py

환경변수:
  BASELINE_CKPT=  — dog_best_balanced_cap.pth (기본)
  SOFTMAX_CKPT=   — dog_best_multitask_softmax.pth (기본)
  RUN_CP=1        — Conformal Prediction (analyze_confusion_and_cp Part B)
  RANK_MODE=      — softmax 기본 product, baseline 기본 binary
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

try:
    from sklearn.metrics import (
        classification_report,
        confusion_matrix,
        f1_score,
        precision_recall_fscore_support,
    )

    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


def _default_rank_mode(is_softmax: bool) -> str:
    """baseline → binary rank, softmax → product (감별 헤드 결합)."""
    raw = os.environ.get("RANK_MODE", "").strip().lower()
    if raw in ("binary", "disc", "product"):
        return raw
    return "product" if is_softmax else "binary"


def _predict_ranked_names(
    outputs: Dict[str, torch.Tensor],
    sample_i: int,
    diseases: List[str],
    *,
    rank_mode: str,
    is_softmax: bool,
) -> List[str]:
    if rank_mode in ("disc", "product") and is_softmax:
        ranked = rank_combined(outputs, sample_i, diseases, mode=rank_mode)
    else:
        ranked = rank_diseases_by_abnormal_prob(outputs, sample_i, diseases)
    return [d for d, _ in ranked]


def _sklearn_classification_metrics(
    y_true: List[int],
    y_pred: List[int],
    diseases: List[str],
) -> Dict[str, object]:
    if not HAS_SKLEARN:
        return {"error": "sklearn 미설치 — pip install scikit-learn"}
    if not y_true:
        return {"error": "비정상 val 샘플 없음"}

    labels = list(range(len(diseases)))
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, zero_division=0,
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    report_txt = classification_report(
        y_true, y_pred, labels=labels, target_names=diseases, zero_division=0,
    )

    per_disease: Dict[str, Dict[str, float | int]] = {}
    for i, d in enumerate(diseases):
        per_disease[d] = {
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }

    return {
        "n_samples": len(y_true),
        "macro_f1": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "weighted_f1": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        "macro_precision": float(
            precision_recall_fscore_support(
                y_true, y_pred, labels=labels, average="macro", zero_division=0,
            )[0]
        ),
        "macro_recall": float(
            precision_recall_fscore_support(
                y_true, y_pred, labels=labels, average="macro", zero_division=0,
            )[1]
        ),
        "per_disease_prf": per_disease,
        "confusion_matrix": {
            "labels": diseases,
            "matrix": cm.tolist(),
        },
        "classification_report": report_txt,
    }


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
    rank_mode: Optional[str] = None,
) -> dict:
    model.eval()
    rank_mode = rank_mode or _default_rank_mode(is_softmax)

    binary_ok = binary_total = 0
    abn_total = 0
    modes = ["binary", "disc", "product"] if is_softmax else ["binary"]
    topk_hits = {m: {k: 0 for k in TOP_KS} for m in modes}
    per_disease = {d: {m: {k: 0 for k in TOP_KS} for m in modes} for d in diseases}
    per_disease_n = defaultdict(int)

    y_true_idx: List[int] = []
    y_pred_idx: List[int] = []

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
            gt_idx = diseases.index(gt_d)

            cls_names = _predict_ranked_names(
                outputs, i, diseases, rank_mode=rank_mode, is_softmax=is_softmax,
            )
            if cls_names:
                pred_d = cls_names[0]
                y_true_idx.append(gt_idx)
                y_pred_idx.append(diseases.index(pred_d))

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

    cls_metrics = _sklearn_classification_metrics(y_true_idx, y_pred_idx, diseases)

    per_disease_metrics: Dict[str, Dict[str, float | int]] = {}
    prf = cls_metrics.get("per_disease_prf", {}) if isinstance(cls_metrics, dict) else {}
    for d in diseases:
        n = per_disease_n[d]
        if n == 0:
            continue
        row: Dict[str, float | int] = {
            "n": n,
            "top1_acc": per_disease[d][rank_mode if rank_mode in modes else "binary"][1] / n,
            "top3_acc": per_disease[d][rank_mode if rank_mode in modes else "binary"][3] / n,
        }
        if d in prf:
            row.update({
                "precision": prf[d]["precision"],
                "recall": prf[d]["recall"],
                "f1": prf[d]["f1"],
            })
        per_disease_metrics[d] = row

    report = {
        "rank_mode_primary": rank_mode,
        "binary_acc": binary_ok / binary_total if binary_total else 0.0,
        "binary_total": binary_total,
        "abnormal_n": abn_total,
        "topk": {},
        "per_disease": per_disease_metrics,
        "abnormal_classification": cls_metrics,
    }
    for mode in modes:
        report["topk"][mode] = {
            f"top_{k}": topk_hits[mode][k] / abn_total if abn_total else 0.0
            for k in TOP_KS
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

    overlap = (split_meta.get("distribution") or {}).get("group_overlap")
    if overlap is not None:
        print(f"\n  crop_D* group train∩val overlap: {overlap} (0이어야 함)")

    if baseline_path.is_file():
        print(f"\n>>> Baseline: {baseline_path.name}  [rank=binary]")
        bl_model = _load_model(baseline_path, animal, device, softmax=False)
        results["models"]["baseline_balanced_cap"] = evaluate_model(
            bl_model, val_ds, val_loader, diseases, device,
            is_softmax=False, rank_mode="binary",
        )
        _print_report(results["models"]["baseline_balanced_cap"], ["binary"])
        _print_abnormal_classification(
            results["models"]["baseline_balanced_cap"], diseases, title="Baseline (binary rank)",
        )
    else:
        print(f"⚠ baseline 없음: {baseline_path}")

    if softmax_path.is_file():
        print(f"\n>>> Softmax multitask: {softmax_path.name}  [rank=product]")
        sm_model = _load_model(softmax_path, animal, device, softmax=True)
        results["models"]["multitask_softmax"] = evaluate_model(
            sm_model, val_ds, val_loader, diseases, device,
            is_softmax=True, rank_mode="product",
        )
        _print_report(results["models"]["multitask_softmax"], ["binary", "disc", "product"])
        _print_abnormal_classification(
            results["models"]["multitask_softmax"], diseases, title="Softmax (product rank)",
        )
    else:
        print(f"⚠ softmax ckpt 없음: {softmax_path} — train_multitask_softmax.py 먼저 실행")

    if "baseline_balanced_cap" in results["models"] and "multitask_softmax" in results["models"]:
        _print_ab_comparison(
            results["models"]["baseline_balanced_cap"],
            results["models"]["multitask_softmax"],
            diseases,
        )

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


def _print_abnormal_classification(
    report: dict,
    diseases: List[str],
    *,
    title: str,
) -> None:
    cls = report.get("abnormal_classification", {})
    if cls.get("error"):
        print(f"\n  ⚠ {title}: {cls['error']}")
        return

    mode = report.get("rank_mode_primary", "?")
    print(f"\n{'=' * 72}")
    print(f"📊 비정상 val — 질환 감별 ({title}, rank={mode}, n={cls.get('n_samples', 0):,})")
    print(f"{'=' * 72}")
    print(
        f"  Macro-F1={cls['macro_f1'] * 100:.2f}%  "
        f"Weighted-F1={cls['weighted_f1'] * 100:.2f}%  "
        f"Macro-P={cls['macro_precision'] * 100:.2f}%  "
        f"Macro-R={cls['macro_recall'] * 100:.2f}%"
    )

    hdr = f"  {'질환':<14} {'n':>6} {'Top-1':>7} {'Top-3':>7} {'Prec':>7} {'Rec':>7} {'F1':>7}"
    print(hdr)
    print("  " + "-" * (len(hdr) - 2))
    for d in diseases:
        row = report.get("per_disease", {}).get(d)
        if not row:
            continue
        print(
            f"  {d:<14} {row['n']:>6} "
            f"{row['top1_acc'] * 100:>6.2f}% {row['top3_acc'] * 100:>6.2f}% "
            f"{row.get('precision', 0) * 100:>6.2f}% {row.get('recall', 0) * 100:>6.2f}% "
            f"{row.get('f1', 0) * 100:>6.2f}%"
        )

    cm_info = cls.get("confusion_matrix", {})
    labels = cm_info.get("labels", diseases)
    matrix = cm_info.get("matrix", [])
    if matrix:
        print(f"\n  Confusion matrix (rows=GT, cols=Pred):")
        short = [d[:4] for d in labels]
        print("  " + " " * 6 + "  ".join(f"{s:>4}" for s in short))
        for i, row in enumerate(matrix):
            print(f"  {labels[i][:6]:<6}" + "  ".join(f"{v:>4}" for v in row))

    if cls.get("classification_report"):
        print(f"\n  sklearn classification_report:\n{cls['classification_report']}")


def _print_ab_comparison(
    baseline: dict,
    softmax: dict,
    diseases: List[str],
) -> None:
    bl_cls = baseline.get("abnormal_classification", {})
    sm_cls = softmax.get("abnormal_classification", {})
    if bl_cls.get("error") or sm_cls.get("error"):
        return

    print(f"\n{'=' * 72}")
    print("📈 A/B — 비정상 val 질환 감별 (Baseline binary vs Softmax product)")
    print(f"{'=' * 72}")

    def _fmt(x: float) -> str:
        return f"{x * 100:.2f}%"

    rows = [
        ("Macro-F1", bl_cls["macro_f1"], sm_cls["macro_f1"]),
        ("Weighted-F1", bl_cls["weighted_f1"], sm_cls["weighted_f1"]),
        ("Top-1 (overall)", baseline["topk"]["binary"]["top_1"], softmax["topk"]["product"]["top_1"]),
        ("Top-3 (overall)", baseline["topk"]["binary"]["top_3"], softmax["topk"]["product"]["top_3"]),
    ]
    print(f"  {'지표':<18} {'Baseline':>12} {'Softmax':>12} {'Δ':>10}")
    print("  " + "-" * 54)
    for name, bl, sm in rows:
        delta = (sm - bl) * 100
        print(f"  {name:<18} {_fmt(bl):>12} {_fmt(sm):>12} {delta:>+9.2f}%p")

    print(f"\n  {'질환':<14} {'BL Top-1':>9} {'SM Top-1':>9} {'BL F1':>8} {'SM F1':>8}")
    print("  " + "-" * 52)
    for d in diseases:
        bl_pd = baseline.get("per_disease", {}).get(d, {})
        sm_pd = softmax.get("per_disease", {}).get(d, {})
        if not bl_pd and not sm_pd:
            continue
        print(
            f"  {d:<14} "
            f"{bl_pd.get('top1_acc', 0) * 100:>8.2f}% "
            f"{sm_pd.get('top1_acc', 0) * 100:>8.2f}% "
            f"{bl_pd.get('f1', 0) * 100:>7.2f}% "
            f"{sm_pd.get('f1', 0) * 100:>7.2f}%"
        )


if __name__ == "__main__":
    main()
