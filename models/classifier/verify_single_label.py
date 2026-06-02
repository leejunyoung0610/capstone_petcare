"""
데이터 단일 라벨 검증 — 이미지 1장 = 활성 질환 1개인지, UUID 중복·복합 라벨 여부.

실행 (프로젝트 루트):
  ANIMAL_TYPE=dog python models/classifier/verify_single_label.py
  CAP_MODE=disease_balanced PRESERVE_SMARTPHONE=true \\
    ANIMAL_TYPE=dog python models/classifier/verify_single_label.py
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from models.classifier.dataset import EyeDiseaseDataset, get_transforms
from models.classifier.dataset_random_split import (
    apply_disease_balanced_caps,
    apply_sample_caps,
    build_sample_metadata,
    create_random_split_dataloaders,
    get_tl_paths,
    resolve_cap_mode,
    resolve_disease_balanced_limit,
    resolve_preserve_smartphone,
    split_indices_from_metas,
)

UUID_RE = re.compile(
    r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})",
    re.IGNORECASE,
)


def extract_uuid(img_path: str) -> Optional[str]:
    m = UUID_RE.search(os.path.basename(img_path))
    return m.group(1).lower() if m else None


def analyze_samples(samples: List[Tuple[str, Dict[str, int]]], diseases: List[str]) -> dict:
    """EyeDiseaseDataset.samples 구조 분석."""
    multi_active = 0
    none_active = 0
    abnormal_multi = 0
    by_disease: Counter = Counter()
    by_stratum: Counter = Counter()
    uuid_to_entries: Dict[str, List[dict]] = defaultdict(list)

    for img_path, label_dict in samples:
        active = [(d, label_dict[d]) for d in diseases if label_dict.get(d, -1) >= 0]
        if len(active) == 0:
            none_active += 1
            continue
        if len(active) > 1:
            multi_active += 1
        disease, label = active[0]
        by_disease[disease] += 1
        by_stratum[f"{disease}_{label}"] += 1
        if label > 0:
            abnormal_heads = sum(1 for d, v in label_dict.items() if v > 0)
            if abnormal_heads > 1:
                abnormal_multi += 1

        uid = extract_uuid(img_path)
        if uid:
            uuid_to_entries[uid].append(
                {
                    "path": img_path,
                    "disease": disease,
                    "label": label,
                    "stratum": f"{disease}_{label}",
                }
            )

    uuid_dup_paths = {u: v for u, v in uuid_to_entries.items() if len(v) > 1}
    uuid_conflict: List[dict] = []
    for uid, entries in uuid_dup_paths.items():
        strata = {(e["disease"], e["label"]) for e in entries}
        diseases_set = {e["disease"] for e in entries}
        if len(strata) > 1 or len(diseases_set) > 1:
            uuid_conflict.append({"uuid": uid, "entries": entries})

    return {
        "total": len(samples),
        "multi_active_label": multi_active,
        "no_active_label": none_active,
        "abnormal_on_multiple_heads": abnormal_multi,
        "unique_uuids": len(uuid_to_entries),
        "uuid_appears_multiple_paths": len(uuid_dup_paths),
        "uuid_cross_disease_conflicts": len(uuid_conflict),
        "uuid_conflict_examples": uuid_conflict[:10],
        "by_disease": dict(by_disease),
        "normal_count": sum(c for k, c in by_stratum.items() if k.endswith("_0")),
        "abnormal_count": sum(c for k, c in by_stratum.items() if not k.endswith("_0")),
    }


def main() -> None:
    animal = os.environ.get("ANIMAL_TYPE", "dog").strip().lower()
    cap_mode = resolve_cap_mode()
    paths = get_tl_paths(animal)

    print("=" * 72)
    print(f"단일 라벨 검증 — {animal.upper()}")
    print(f"  TL paths: {paths}")
    print(f"  CAP_MODE={cap_mode}")
    print("=" * 72)

    base = EyeDiseaseDataset(
        data_paths=paths,
        animal_type=animal,
        transform=get_transforms(is_training=False, img_size=300),
        is_training=False,
    )
    diseases = base.diseases

    raw = analyze_samples(base.samples, diseases)
    print("\n[1] Raw TL (cap/split 전)")
    _print_stats(raw)

    metas = build_sample_metadata(base)
    if cap_mode == "disease_balanced":
        limit = resolve_disease_balanced_limit()
        preserve = resolve_preserve_smartphone()
        capped, _ = apply_disease_balanced_caps(
            metas, disease_limit=limit, preserve_smartphone=preserve, seed=42
        )
        metas = capped
    else:
        capped, _ = apply_sample_caps(metas, max_per_class=5000, seed=42)
        metas = capped

    capped_samples = [base.samples[m.index] for m in metas]
    capped_stats = analyze_samples(capped_samples, diseases)
    print(f"\n[2] After cap ({cap_mode})")
    _print_stats(capped_stats)

    split_seed = int(os.environ.get("SPLIT_SEED", "42"))
    val_ratio = float(os.environ.get("VAL_RATIO", "0.2"))
    use_group = os.environ.get("USE_GROUP_SPLIT", "1").strip().lower() in ("1", "true", "yes")
    train_idx, val_idx, split_meta = split_indices_from_metas(
        metas, seed=split_seed, val_ratio=val_ratio, use_group_split=use_group
    )
    val_samples = [base.samples[i] for i in val_idx]
    val_stats = analyze_samples(val_samples, diseases)
    print(f"\n[3] Val split (seed={split_seed}, group={use_group})")
    _print_stats(val_stats)
    print(f"  train={len(train_idx):,}  val={len(val_idx):,}")
    print(f"  group overlap check: {split_meta.get('train_val_group_overlap', 'n/a')}")

    out = {
        "animal_type": animal,
        "cap_mode": cap_mode,
        "raw": raw,
        "capped": capped_stats,
        "val": val_stats,
        "split_meta": split_meta,
        "conclusion": _conclusion(raw, capped_stats, val_stats),
    }
    out_path = Path("models/classifier/eval_results") / f"single_label_audit_{animal}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\n✓ JSON 저장: {out_path}")
    print(f"\n{'=' * 72}")
    print("결론:", out["conclusion"])
    print("=" * 72)


def _print_stats(st: dict) -> None:
    print(f"  total samples     : {st['total']:,}")
    print(f"  normal / abnormal : {st['normal_count']:,} / {st['abnormal_count']:,}")
    print(f"  multi active lbl  : {st['multi_active_label']:,}  ← 0이면 단일 라벨 OK")
    print(f"  no active label   : {st['no_active_label']:,}")
    print(f"  abnormal multi-h  : {st['abnormal_on_multiple_heads']:,}")
    print(f"  unique UUIDs      : {st['unique_uuids']:,}")
    print(f"  UUID dup paths    : {st['uuid_appears_multiple_paths']:,}")
    print(f"  UUID cross-disease: {st['uuid_cross_disease_conflicts']:,}")
    if st.get("uuid_conflict_examples"):
        print("  conflict examples:")
        for ex in st["uuid_conflict_examples"][:3]:
            print(f"    {ex['uuid'][:8]}… → {[(e['disease'], e['label']) for e in ex['entries']]}")


def _conclusion(raw: dict, capped: dict, val: dict) -> str:
    issues = []
    for name, st in [("raw", raw), ("capped", capped), ("val", val)]:
        if st["multi_active_label"] > 0:
            issues.append(f"{name}: multi_active={st['multi_active_label']}")
        if st["uuid_cross_disease_conflicts"] > 0:
            issues.append(f"{name}: uuid_conflicts={st['uuid_cross_disease_conflicts']}")
    if not issues:
        return (
            "단일 라벨 가정 성공 — 각 이미지는 정확히 1개 질환 헤드만 활성(label>=0), "
            "비정상은 해당 질환 1개만 양성. softmax 10-class 감별 학습 가능."
        )
    return "주의: " + "; ".join(issues)


if __name__ == "__main__":
    main()
