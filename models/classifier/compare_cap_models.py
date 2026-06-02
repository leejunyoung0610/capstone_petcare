"""
5k stratum cap vs disease-balanced cap 모델 나란히 비교.

동일 평가 파이프라인 (eval_multitask_topk + confusion + device subset + per-head F1).
각 모델은 학습 시 사용한 CAP_MODE로 val split을 재구성합니다.

실행 (프로젝트 루트):
  ANIMAL_TYPE=dog python models/classifier/compare_cap_models.py

  # 체크포인트 경로 지정
  STRATUM_CKPT=models/classifier/checkpoints/dog_best_random_split.pth \\
  BALANCED_CKPT=models/classifier/checkpoints/dog_best_balanced_cap.pth \\
  ANIMAL_TYPE=dog python models/classifier/compare_cap_models.py

환경변수:
  ANIMAL_TYPE=dog|cat
  SPLIT_SEED=42  VAL_RATIO=0.2
  STRATUM_CKPT=  BALANCED_CKPT=
  BATCH_SIZE=32  DEVICE=
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterator, List, Mapping, Optional, Sequence

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from models.classifier.analyze_confusion_and_cp import analyze_part_a
from models.classifier.dataset_random_split import (
    MEDICAL_DEVICES,
    SMARTPHONE,
    RandomSplitEyeDataset,
    create_random_split_dataloaders,
)
from models.classifier.eval_multitask_topk import (
    _active_disease_and_label,
    evaluate_multitask_topk,
)
from models.classifier.inference_multitask import extract_state_dict
from models.classifier.model import create_model
from models.classifier.train import get_device, resolve_batch_size, resolve_num_workers
from models.classifier.random_split_common import RandomSplitConfig
from models.classifier.train_random_split import evaluate_device_subsets

REF_DISEASE = "백내장"


@contextmanager
def cap_env(overrides: Mapping[str, str]) -> Iterator[None]:
    """CAP_MODE 등 환경변수 임시 설정."""
    saved = {k: os.environ.get(k) for k in overrides}
    try:
        for k, v in overrides.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        yield
    finally:
        for k, old in saved.items():
            if old is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = old


def _default_checkpoints(animal: str) -> Dict[str, Path]:
    out = Path(RandomSplitConfig.OUTPUT_DIR)
    return {
        "stratum_5k": out / f"{animal}_best_random_split.pth",
        "balanced_cap": out / f"{animal}_best_balanced_cap.pth",
    }


def _disease_level_f1(
    cm: Dict[str, Dict[str, int]],
    diseases: Sequence[str],
) -> Dict[str, object]:
    """Top-1 질환 분류 confusion → 질환별 F1 + macro/weighted."""
    totals = {d: sum(cm[d].values()) for d in diseases}
    per_disease: Dict[str, Dict[str, float]] = {}
    f1s: List[float] = []
    weights: List[int] = []

    for d in diseases:
        tp = cm[d][d]
        fp = sum(cm[gt][d] for gt in diseases if gt != d)
        fn = sum(cm[d][pred] for pred in diseases if pred != d)
        p = tp / (tp + fp) if tp + fp else 0.0
        r = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * p * r / (p + r) if p + r else 0.0
        sup = totals[d]
        per_disease[d] = {"precision": p, "recall": r, "f1": f1, "support": sup}
        if sup > 0:
            f1s.append(f1)
            weights.append(sup)

    wsum = sum(weights) or 1
    return {
        "per_disease": per_disease,
        "macro_f1": sum(f1s) / len(f1s) if f1s else 0.0,
        "weighted_f1": sum(f * w for f, w in zip(f1s, weights)) / wsum,
    }


def _cataract_absorption_rate(
    cm: Dict[str, Dict[str, int]],
    diseases: Sequence[str],
    target: str = REF_DISEASE,
) -> Dict[str, object]:
    """다른 질환 → target Top-1 오분류율 (백내장 쏠림 지표)."""
    mis_to_target = 0
    non_target_total = 0
    per_source: Dict[str, float] = {}
    for d in diseases:
        if d == target:
            continue
        n = sum(cm[d].values())
        if n == 0:
            continue
        rate = cm[d][target] / n
        per_source[d] = rate
        mis_to_target += cm[d][target]
        non_target_total += n
    return {
        "global_rate": mis_to_target / non_target_total if non_target_total else 0.0,
        "misclassified_to_target": mis_to_target,
        "non_target_total": non_target_total,
        "per_source": per_source,
    }


@torch.no_grad()
def _per_head_f1(
    model: nn.Module,
    val_loader: DataLoader,
    val_ds: RandomSplitEyeDataset,
    diseases: List[str],
    device: str,
) -> Dict[str, object]:
    """활성 질환 헤드 기준 severity macro/weighted F1."""
    model.eval()
    per_disease: Dict[str, Dict[str, object]] = {}

    for disease in diseases:
        num_classes = len(val_ds.label_map[disease])
        cm = torch.zeros(num_classes, num_classes, dtype=torch.int64)
        local_idx = 0

        for images, labels in val_loader:
            images = images.to(device)
            outputs = model(images)
            bs = images.size(0)
            for i in range(bs):
                if local_idx >= len(val_ds):
                    break
                gt_d, gt_y = _active_disease_and_label(labels, i, diseases)
                if gt_d != disease or gt_y < 0:
                    local_idx += 1
                    continue
                pred = torch.max(outputs[disease][i], dim=0)[1].item()
                cm[gt_y, pred] += 1
                local_idx += 1

        f1s, weights = [], []
        class_f1: Dict[str, float] = {}
        names = {v: k for k, v in val_ds.label_map[disease].items()}
        for c in range(num_classes):
            tp = cm[c, c].item()
            fp = cm[:, c].sum().item() - tp
            fn = cm[c, :].sum().item() - tp
            p = tp / (tp + fp) if tp + fp else 0.0
            r = tp / (tp + fn) if tp + fn else 0.0
            f1 = 2 * p * r / (p + r) if p + r else 0.0
            sup = int(cm[c, :].sum().item())
            if sup > 0:
                f1s.append(f1)
                weights.append(sup)
            class_f1[names.get(c, str(c))] = f1

        wsum = sum(weights) or 1
        per_disease[disease] = {
            "macro_f1": sum(f1s) / len(f1s) if f1s else 0.0,
            "weighted_f1": sum(f * w for f, w in zip(f1s, weights)) / wsum,
            "per_class_f1": class_f1,
            "support": int(cm.sum().item()),
        }

    macro_vals = [v["macro_f1"] for v in per_disease.values() if v["support"] > 0]
    return {
        "per_disease": per_disease,
        "mean_macro_f1": sum(macro_vals) / len(macro_vals) if macro_vals else 0.0,
    }


def evaluate_one_model(
    *,
    name: str,
    checkpoint: Path,
    animal: str,
    cap_env_overrides: Dict[str, str],
    device: str,
    batch_size: int,
    num_workers: int,
    img_size: int,
    mutual_threshold: float,
) -> Dict[str, object]:
    if not checkpoint.is_file():
        raise FileNotFoundError(f"[{name}] checkpoint 없음: {checkpoint}")

    with cap_env(cap_env_overrides):
        _, val_loader, _, val_ds, split_meta = create_random_split_dataloaders(
            animal_type=animal,
            batch_size=batch_size,
            img_size=img_size,
            num_workers=num_workers,
            use_sampler=False,
            mode="multitask",
        )

        model = create_model(animal, pretrained=False)
        ckpt = torch.load(checkpoint, map_location=device, weights_only=False)
        model.load_state_dict(extract_state_dict(ckpt))
        model.to(device)
        model.eval()
        diseases = model.get_disease_names()

        topk = evaluate_multitask_topk(model, val_ds, val_loader, diseases, device)
        device_report = evaluate_device_subsets(model, val_ds, val_loader, diseases, device)
        head_f1 = _per_head_f1(model, val_loader, val_ds, diseases, device)

        cm_dict = {
            gt: {pred: topk["confusion_matrix_top1"]["matrix"][i][j]
                 for j, pred in enumerate(diseases)}
            for i, gt in enumerate(diseases)
        }
        disease_f1 = _disease_level_f1(cm_dict, diseases)
        cataract_pull = _cataract_absorption_rate(cm_dict, diseases)

        from models.classifier.analyze_confusion_and_cp import (
            abnormal_records,
            collect_inference_records,
        )

        records = collect_inference_records(model, val_loader, val_ds, diseases, device)
        abn = abnormal_records(records)
        part_a = analyze_part_a(abn, diseases, mutual_threshold)

    return {
        "name": name,
        "checkpoint": str(checkpoint),
        "cap_env": dict(cap_env_overrides),
        "split_meta": split_meta,
        "topk": {
            "top_1": topk["topk_accuracy"]["top_1"],
            "top_3": topk["topk_accuracy"]["top_3"],
            "n_abnormal": topk["n_abnormal"],
        },
        "per_disease_top3": topk["per_disease_top3_hit_rate"],
        "device_top1": {
            "all": device_report["val_mean_acc_all"],
            SMARTPHONE: device_report["val_smartphone_acc"],
            "medical": device_report["val_medical_acc"],
            "smartphone_abnormal": device_report["val_smartphone_abnormal_acc"],
            "counts": device_report["counts"],
        },
        "disease_ranking_f1": disease_f1,
        "head_severity_f1": head_f1,
        "cataract_absorption": cataract_pull,
        "confusion_top1": cm_dict,
        "mutual_confusion_pairs": len(part_a["mutual_pairs"]),
        "top_misclass": part_a["top_directional_misclass"][:5],
    }


def print_comparison(reports: Sequence[Dict[str, object]], diseases: Sequence[str]) -> None:
    if len(reports) != 2:
        for r in reports:
            print(json.dumps(r, ensure_ascii=False, indent=2, default=str))
        return

    a, b = reports[0], reports[1]
    print(f"\n{'=' * 80}")
    print(f"모델 비교: {a['name']}  vs  {b['name']}")
    print(f"{'=' * 80}")
    print(f"  A: {a['checkpoint']}")
    print(f"  B: {b['checkpoint']}")

    def row(metric: str, va, vb, fmt: str = ".4f", higher_better: bool = True) -> None:
        delta = vb - va if isinstance(va, (int, float)) and isinstance(vb, (int, float)) else None
        arrow = ""
        if delta is not None and delta != 0:
            better = (delta > 0) if higher_better else (delta < 0)
            arrow = " ↑" if better else " ↓"
        d_str = f"  Δ{delta:+{fmt}}" if delta is not None else ""
        print(f"  {metric:<32} {va:{fmt}}  {vb:{fmt}}{d_str}{arrow}")

    print(f"\n--- Top-K (비정상 n={a['topk']['n_abnormal']}/{b['topk']['n_abnormal']}) ---")
    row("Top-1", a["topk"]["top_1"], b["topk"]["top_1"])
    row("Top-3", a["topk"]["top_3"], b["topk"]["top_3"])

    print("\n--- 질환 Top-3 hit rate ---")
    for d in diseases:
        ra = a["per_disease_top3"].get(d, {})
        rb = b["per_disease_top3"].get(d, {})
        if not ra and not rb:
            continue
        va = ra.get("top_3_hit_rate", 0.0)
        vb = rb.get("top_3_hit_rate", 0.0)
        row(f"  {d}", va, vb)

    print("\n--- 질환 Top-1 ranking F1 ---")
    row("Macro-F1", a["disease_ranking_f1"]["macro_f1"], b["disease_ranking_f1"]["macro_f1"])
    row("Weighted-F1", a["disease_ranking_f1"]["weighted_f1"], b["disease_ranking_f1"]["weighted_f1"])
    for d in diseases:
        fa = a["disease_ranking_f1"]["per_disease"].get(d, {})
        fb = b["disease_ranking_f1"]["per_disease"].get(d, {})
        if fa.get("support", 0) == 0 and fb.get("support", 0) == 0:
            continue
        row(f"  {d} F1", fa.get("f1", 0.0), fb.get("f1", 0.0))

    print(f"\n--- 백내장 쏠림 (→{REF_DISEASE} Top-1 오분류) ---")
    row("전역 흡수율", a["cataract_absorption"]["global_rate"],
        b["cataract_absorption"]["global_rate"], higher_better=False)
    row(f"{REF_DISEASE} Top-3 hit",
        a["per_disease_top3"].get(REF_DISEASE, {}).get("top_3_hit_rate", 0.0),
        b["per_disease_top3"].get(REF_DISEASE, {}).get("top_3_hit_rate", 0.0))

    print("\n--- Device subset Top-1 (헤드 accuracy) ---")
    row("전체", a["device_top1"]["all"], b["device_top1"]["all"])
    row("스마트폰", a["device_top1"][SMARTPHONE], b["device_top1"][SMARTPHONE])
    row("검안경/의료", a["device_top1"]["medical"], b["device_top1"]["medical"])
    row("SP+비정상", a["device_top1"]["smartphone_abnormal"],
        b["device_top1"]["smartphone_abnormal"])

    print("\n--- 헤드 severity Macro-F1 (질환 내 class) ---")
    row("평균 Macro-F1", a["head_severity_f1"]["mean_macro_f1"],
        b["head_severity_f1"]["mean_macro_f1"])
    for d in diseases:
        ha = a["head_severity_f1"]["per_disease"].get(d, {})
        hb = b["head_severity_f1"]["per_disease"].get(d, {})
        if ha.get("support", 0) == 0 and hb.get("support", 0) == 0:
            continue
        row(f"  {d}", ha.get("macro_f1", 0.0), hb.get("macro_f1", 0.0))


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="stratum cap vs disease-balanced cap 비교")
    p.add_argument("--animal", default=os.environ.get("ANIMAL_TYPE", "dog"), choices=["dog", "cat"])
    p.add_argument("--device", default=os.environ.get("DEVICE"))
    p.add_argument("--batch-size", type=int, default=None)
    p.add_argument("--mutual-threshold", type=float, default=0.10)
    p.add_argument("--stratum-ckpt", default=os.environ.get("STRATUM_CKPT", ""))
    p.add_argument("--balanced-ckpt", default=os.environ.get("BALANCED_CKPT", ""))
    p.add_argument("--skip-balanced", action="store_true", help="balanced 모델 없으면 stratum만")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    animal = args.animal.strip().lower()
    device = args.device or get_device()
    img_size = int(os.environ.get("IMG_SIZE", str(RandomSplitConfig.IMG_SIZE)))
    batch_size = resolve_batch_size(
        args.batch_size if args.batch_size is not None else int(os.environ.get("BATCH_SIZE", "32"))
    )
    num_workers = resolve_num_workers(int(os.environ.get("NUM_WORKERS", "4")))

    defaults = _default_checkpoints(animal)
    stratum_ckpt = Path(args.stratum_ckpt) if args.stratum_ckpt else defaults["stratum_5k"]
    balanced_ckpt = Path(args.balanced_ckpt) if args.balanced_ckpt else defaults["balanced_cap"]

    specs = [
        {
            "name": "5k stratum cap",
            "checkpoint": stratum_ckpt,
            "cap_env": {
                "CAP_MODE": "stratum",
                "MAX_PER_CLASS": os.environ.get("MAX_PER_CLASS", "5000"),
                "DISEASE_CAPS": os.environ.get("DISEASE_CAPS", ""),
            },
        },
        {
            "name": "disease-balanced cap",
            "checkpoint": balanced_ckpt,
            "cap_env": {
                "CAP_MODE": "disease_balanced",
                "DISEASE_BALANCED_LIMIT": os.environ.get("DISEASE_BALANCED_LIMIT", "5000"),
                "PRESERVE_SMARTPHONE": os.environ.get("PRESERVE_SMARTPHONE", "true"),
            },
        },
    ]

    print("=" * 80)
    print(f"Cap 모델 비교 ({animal.upper()})")
    print("=" * 80)
    print(f"  device={device}  SPLIT_SEED={os.environ.get('SPLIT_SEED', '42')}")

    reports: List[Dict[str, object]] = []
    for spec in specs:
        if spec["name"].startswith("disease") and args.skip_balanced:
            continue
        if not spec["checkpoint"].is_file():
            print(f"\n⚠ [{spec['name']}] checkpoint 없음 — skip: {spec['checkpoint']}")
            continue
        print(f"\n>>> Evaluating: {spec['name']} ...")
        reports.append(
            evaluate_one_model(
                name=spec["name"],
                checkpoint=spec["checkpoint"],
                animal=animal,
                cap_env_overrides=spec["cap_env"],
                device=device,
                batch_size=batch_size,
                num_workers=num_workers,
                img_size=img_size,
                mutual_threshold=args.mutual_threshold,
            )
        )

    if not reports:
        raise SystemExit("평가 가능한 checkpoint가 없습니다.")

    from models.classifier.dataset import DOG_LABEL_MAP, CAT_LABEL_MAP
    diseases = list((DOG_LABEL_MAP if animal == "dog" else CAT_LABEL_MAP).keys())
    print_comparison(reports, diseases)

    out_dir = Path(RandomSplitConfig.OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = out_dir / f"compare_cap_{animal}_{ts}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"animal": animal, "reports": reports, "timestamp": ts}, f,
                  ensure_ascii=False, indent=2, default=str)
    print(f"\n✓ JSON 저장: {out_path}")


if __name__ == "__main__":
    main()
