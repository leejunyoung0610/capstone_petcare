"""
5k cap 적용 후 train/val 분포 진단 — 백내장(4-class) vs 핵경화(2-class) 비정상 샘플 불균형 검증.

재학습·모델 로드 없음. eval_multitask_topk / train_random_split 과 동일 파이프라인:
  TL 수집 → (EyeDiseaseDataset 1차 cap) → apply_sample_caps (2차 cap)
  → crop_D* group split (SPLIT_SEED=42, VAL_RATIO=0.2)

실행 (프로젝트 루트):
  MAX_PER_CLASS=5000 ANIMAL_TYPE=dog python models/classifier/analyze_cap_distribution.py
  CAP_MODE=disease_balanced DISEASE_BALANCED_LIMIT=5000 PRESERVE_SMARTPHONE=true \\
    ANIMAL_TYPE=dog python models/classifier/analyze_cap_distribution.py
  MAX_PER_CLASS=5000 ANIMAL_TYPE=cat python models/classifier/analyze_cap_distribution.py

환경변수:
  ANIMAL_TYPE=dog|cat
  SPLIT_SEED=42
  VAL_RATIO=0.2
  USE_GROUP_SPLIT=1
  MAX_PER_CLASS=5000          — stratum(질환_라벨)당 상한
  CAP_MODE=stratum|disease_balanced
  DISEASE_BALANCED_LIMIT=5000 — disease_balanced 질환당 상한
  PRESERVE_SMARTPHONE=true
  DISEASE_CAPS='{"핵경화":7000}' — 질환 전체 합산 상한 (선택)
  DATASET_PRIMARY_CAP=50000     — EyeDiseaseDataset 1차 cap (dataset.py)
"""

from __future__ import annotations

import argparse
import os
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Mapping, Optional, Sequence, Tuple

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from models.classifier.dataset import CAT_LABEL_MAP, DOG_LABEL_MAP, EyeDiseaseDataset
from models.classifier.dataset_random_split import (
    MEDICAL_DEVICES,
    SMARTPHONE,
    SampleMeta,
    apply_disease_balanced_caps,
    apply_sample_caps,
    build_sample_metadata,
    get_tl_paths,
    resolve_cap_mode,
    resolve_disease_balanced_limit,
    resolve_disease_caps,
    resolve_max_per_class,
    resolve_preserve_smartphone,
    split_indices_from_metas,
)

REF_DISEASE = "백내장"
CANONICAL_DEVICES = ("스마트폰", "검안경", "일반카메라")
DEVICE_COLS = CANONICAL_DEVICES + ("(기타/미상)",)


def _label_names(label_map: Mapping[str, Mapping[str, int]], disease: str) -> Dict[int, str]:
    return {idx: name for name, idx in label_map[disease].items()}


def _is_normal(label: int) -> bool:
    return label == 0


def _normalize_device(raw: str) -> str:
    name = (raw or "").strip()
    if name in CANONICAL_DEVICES:
        return name
    if name in MEDICAL_DEVICES:
        return name
    if name in ("(missing_json)", "(empty)", "(read_error)", "(unknown)"):
        return "(기타/미상)"
    return name if name else "(기타/미상)"


def _device_bucket(raw: str) -> str:
    """표 출력용 3대 device + 기타."""
    d = _normalize_device(raw)
    return d if d in CANONICAL_DEVICES else "(기타/미상)"


def _filter_metas(
    metas: Sequence[SampleMeta],
    indices: Optional[Sequence[int]] = None,
    *,
    abnormal_only: bool = False,
) -> List[SampleMeta]:
    idx_set = set(indices) if indices is not None else None
    out: List[SampleMeta] = []
    for m in metas:
        if idx_set is not None and m.index not in idx_set:
            continue
        if abnormal_only and m.label <= 0:
            continue
        out.append(m)
    return out


def _device_abnormal_by_disease(
    metas: Sequence[SampleMeta],
    diseases: Sequence[str],
) -> Dict[str, Dict[str, int]]:
    """질환별 비정상 샘플 device 카운트."""
    counts: Dict[str, Dict[str, int]] = {d: {c: 0 for c in DEVICE_COLS} for d in diseases}
    for m in metas:
        if m.label <= 0 or m.disease not in counts:
            continue
        bucket = _device_bucket(m.device)
        counts[m.disease][bucket] += 1
    return counts


def _global_abnormal_device(metas: Sequence[SampleMeta]) -> Dict[str, int]:
    c: Counter[str] = Counter()
    for m in metas:
        if m.label <= 0:
            continue
        c[_device_bucket(m.device)] += 1
    return {col: c.get(col, 0) for col in DEVICE_COLS}


def _smartphone_abnormal_stats(metas: Sequence[SampleMeta]) -> Tuple[int, int, float]:
    abn = [m for m in metas if m.label > 0]
    total = len(abn)
    sp = sum(1 for m in abn if _device_bucket(m.device) == SMARTPHONE)
    ratio = sp / total if total else 0.0
    return sp, total, ratio


def _print_disease_device_table(
    title: str,
    by_dis: Dict[str, Dict[str, int]],
    diseases: Sequence[str],
    *,
    show_sp_pct: bool = True,
) -> None:
    print(f"\n  {title}")
    if show_sp_pct:
        hdr = (
            f"  {'질환':<14} {'비정상':>7} "
            f"{'스마트폰':>8} {'검안경':>7} {'일반카메라':>8} {'기타':>6} "
            f"{'SP%':>6}"
        )
    else:
        hdr = (
            f"  {'질환':<14} {'비정상':>7} "
            f"{'스마트폰':>8} {'검안경':>7} {'일반카메라':>8} {'기타':>6}"
        )
    print(hdr)
    print("  " + "-" * (len(hdr) - 2))
    for disease in diseases:
        d = by_dis[disease]
        total = sum(d.values())
        sp = d[SMARTPHONE]
        sp_pct = sp / total * 100 if total else 0
        row = (
            f"  {disease:<14} {total:>7,} "
            f"{d[SMARTPHONE]:>8,} {d['검안경']:>7,} {d['일반카메라']:>8,} "
            f"{d['(기타/미상)']:>6,}"
        )
        if show_sp_pct:
            row += f" {sp_pct:>5.1f}%"
        print(row)


def _print_original_zero_inventory(
    pre_by_dis: Dict[str, Dict[str, int]],
    diseases: Sequence[str],
) -> Dict[str, List[str]]:
    """원본(pre-cap)에서 count=0인 질환×device 셀 inventory."""
    zero_sp: List[str] = []
    zero_by_device: Dict[str, List[str]] = {dev: [] for dev in CANONICAL_DEVICES}
    all_zero_cells: List[str] = []

    for disease in diseases:
        d = pre_by_dis[disease]
        total = sum(d.values())
        if d[SMARTPHONE] == 0:
            zero_sp.append(disease)
        for dev in CANONICAL_DEVICES:
            if d[dev] == 0:
                zero_by_device[dev].append(disease)
        for dev in DEVICE_COLS:
            if d[dev] == 0 and total > 0:
                all_zero_cells.append(f"{disease}×{dev}")

    print("\n  [원본 inventory] pre-cap 비정상에서 count=0인 셀")
    for dev in CANONICAL_DEVICES:
        zs = zero_by_device[dev]
        print(f"    · {dev}+비정상 = 0 인 질환 ({len(zs)}/{len(diseases)}): "
              f"{', '.join(zs) if zs else '(없음)'}")
    has_sp = [d for d in diseases if d not in zero_sp]
    print(f"    · 스마트폰+비정상 > 0 인 질환 ({len(has_sp)}): "
          f"{', '.join(f'{d}({pre_by_dis[d][SMARTPHONE]:,})' for d in has_sp)}")

    return {"zero_sp_diseases": zero_sp, "zero_by_device": zero_by_device}


def _print_device_retention_matrix(
    pre_by_dis: Dict[str, Dict[str, int]],
    post_by_dis: Dict[str, Dict[str, int]],
    diseases: Sequence[str],
) -> None:
    """질환×device 전체 cap 전→후 보존율 (SP만이 아닌 3 device 모두)."""
    print("\n  [질환×device] cap 전→후 보존율 (비정상, 0→0 은 '원본0')")
    hdr = f"  {'질환':<12} {'device':<10} {'전':>8} {'후':>8} {'보존율':>8} {'비고':>8}"
    print(hdr)
    print("  " + "-" * (len(hdr) - 2))
    for disease in diseases:
        for dev in CANONICAL_DEVICES:
            pre_n = pre_by_dis[disease][dev]
            post_n = post_by_dis[disease][dev]
            if pre_n == 0 and post_n == 0:
                note = "원본0"
                ret_str = "—"
            elif pre_n == 0:
                note = "원본0↑?"
                ret_str = "N/A"
            elif post_n == 0:
                note = "전멸"
                ret_str = "0%"
            else:
                note = ""
                ret_str = f"{post_n / pre_n * 100:.1f}%"
            print(
                f"  {disease:<12} {dev:<10} {pre_n:>8,} {post_n:>8,} {ret_str:>8} {note:>8}"
            )

def _classify_device_cap_effect(
    pre_ratio: float,
    post_ratio: float,
    retention: float,
) -> str:
    """cap이 device 분포에 미친 영향 — (a)보존 (b)희석 (c)악화."""
    ratio_delta_pp = (post_ratio - pre_ratio) * 100
    if retention >= 0.95 and abs(ratio_delta_pp) < 2.0:
        return "(a) 보존"
    if retention >= 0.80 and ratio_delta_pp > -5.0:
        return "(b) 희석"
    return "(c) 악화"


def _print_device_aware_section(
    pre_cap: Sequence[SampleMeta],
    post_cap: Sequence[SampleMeta],
    train_metas: Sequence[SampleMeta],
    diseases: Sequence[str],
) -> Dict[str, object]:
    """6) device-aware — 원본(pre-cap) 질환×device 전체 + cap 전후."""
    print(f"\n{'=' * 72}")
    print("6) Device-aware 분포 (비정상 · 원본 pre-cap 기준 포함)")
    print("=" * 72)

    pre_by_dis = _device_abnormal_by_disease(pre_cap, diseases)
    post_by_dis = _device_abnormal_by_disease(post_cap, diseases)
    train_by_dis = _device_abnormal_by_disease(train_metas, diseases)

    pre_sp, pre_abn, pre_ratio = _smartphone_abnormal_stats(pre_cap)
    post_sp, post_abn, post_ratio = _smartphone_abnormal_stats(post_cap)

    # ── 6-A. 원본(pre-cap) ──────────────────────────────────────────────
    print("\n  ── 6-A. 원본(pre-cap, 2차 cap 적용 **전**) ──")
    print("\n  [전역] 원본 비정상 device 분포")
    pre_dev = _global_abnormal_device(pre_cap)
    for col in DEVICE_COLS:
        n = pre_dev[col]
        pct = n / pre_abn * 100 if pre_abn else 0
        print(f"    {col}: {n:,} ({pct:.1f}%)")
    print(f"    합계 비정상: {pre_abn:,}  ·  SP+비정상: {pre_sp:,} ({pre_ratio * 100:.2f}%)")

    _print_disease_device_table(
        "[질환별] 원본 pre-cap 비정상 — device 분포",
        pre_by_dis,
        diseases,
    )
    zero_inv = _print_original_zero_inventory(pre_by_dis, diseases)

    # ── 6-B. cap 후 ─────────────────────────────────────────────────────
    print("\n  ── 6-B. cap 적용 후 (2차 cap) ──")
    global_ret = post_sp / pre_sp if pre_sp else float("nan")
    global_verdict = _classify_device_cap_effect(pre_ratio, post_ratio, global_ret)

    print("\n  [전역] cap 후 비정상 device 분포")
    post_dev = _global_abnormal_device(post_cap)
    for col in DEVICE_COLS:
        n = post_dev[col]
        pct = n / post_abn * 100 if post_abn else 0
        print(f"    {col}: {n:,} ({pct:.1f}%)")
    print(f"    합계 비정상: {post_abn:,}  ·  SP+비정상: {post_sp:,} ({post_ratio * 100:.2f}%)")
    print(f"\n  [전역 cap 효과] SP+비정상: {pre_sp:,} → {post_sp:,} "
          f"(보존 {global_ret * 100:.1f}%, Δ비율 {(post_ratio - pre_ratio) * 100:+.2f}pp) "
          f"· {global_verdict}")

    _print_disease_device_table(
        "[질환별] cap 후 비정상 — device 분포",
        post_by_dis,
        diseases,
    )

    _print_device_retention_matrix(pre_by_dis, post_by_dis, diseases)

    # ── 6-C. SP 집중 질환 cap 전후 ──────────────────────────────────────
    print("\n  ── 6-C. 스마트폰+비정상 (원본>0 질환만 cap 전후) ──")
    hdr2 = (
        f"  {'질환':<14} {'전(SP)':>8} {'후(SP)':>8} {'보존율':>8} "
        f"{'전%':>7} {'후%':>7} {'Δpp':>7} {'판정':>12}"
    )
    print(hdr2)
    print("  " + "-" * (len(hdr2) - 2))

    per_disease: Dict[str, Dict[str, float]] = {}
    retentions: List[float] = []

    for disease in diseases:
        pre_d = pre_by_dis[disease]
        post_d = post_by_dis[disease]
        pre_total = sum(pre_d.values())
        post_total = sum(post_d.values())
        pre_sp_d = pre_d[SMARTPHONE]
        post_sp_d = post_d[SMARTPHONE]
        pre_r = pre_sp_d / pre_total if pre_total else 0.0
        post_r = post_sp_d / post_total if post_total else 0.0
        ret = post_sp_d / pre_sp_d if pre_sp_d else float("nan")
        if pre_sp_d > 0 and ret == ret:
            retentions.append(ret)
            verdict = _classify_device_cap_effect(pre_r, post_r, ret)
        elif pre_sp_d == 0:
            verdict = "원본0"
        else:
            verdict = "—"
        per_disease[disease] = {
            "pre_sp": pre_sp_d,
            "post_sp": post_sp_d,
            "retention": ret,
            "pre_ratio": pre_r,
            "post_ratio": post_r,
            "verdict": verdict,
        }
        ret_str = f"{ret * 100:.1f}%" if ret == ret else "—"
        print(
            f"  {disease:<14} {pre_sp_d:>8,} {post_sp_d:>8,} {ret_str:>8} "
            f"{pre_r * 100:>6.1f}% {post_r * 100:>6.1f}% "
            f"{(post_r - pre_r) * 100:>+6.1f} {verdict:>12}"
        )

    _print_disease_device_table(
        "[Train] cap+split 후 학습 비정상 — device 분포",
        train_by_dis,
        diseases,
    )

    mean_ret = sum(retentions) / len(retentions) if retentions else float("nan")
    return {
        "pre_sp_abn": pre_sp,
        "post_sp_abn": post_sp,
        "pre_ratio": pre_ratio,
        "post_ratio": post_ratio,
        "global_retention": global_ret,
        "global_verdict": global_verdict,
        "mean_disease_retention": mean_ret,
        "per_disease": per_disease,
        "zero_sp_diseases": zero_inv["zero_sp_diseases"],
    }


def print_cap_mechanism(
    max_per_class: Optional[int],
    disease_caps: Dict[str, int],
    *,
    cap_mode: str = "stratum",
    disease_limit: Optional[int] = None,
    preserve_smartphone: bool = False,
) -> None:
    print("\n" + "=" * 72)
    if cap_mode == "disease_balanced":
        print("1) Cap 적용 방식 (dataset_random_split.apply_disease_balanced_caps)")
        print("=" * 72)
        print(
            f"""
  CAP_MODE=disease_balanced
    · 질환당 정상(무) 상한 = DISEASE_BALANCED_LIMIT ({disease_limit:,})
    · 질환당 비정상 총량 상한 = DISEASE_BALANCED_LIMIT ({disease_limit:,})
      - 다중 severity (백내장 3-class): limit을 severity 수로 균등 분할 (~{disease_limit // 3 if disease_limit else 0:,}/class)
      - 단일 severity (핵경화): ~{disease_limit:,}/class
    · PRESERVE_SMARTPHONE={preserve_smartphone} — cap 시 SP+비정상 우선, 검안경 먼저 제거
    · 서브샘플: seed 고정 무작위 shuffle (device 순 정렬 편향 방지)
"""
        )
    else:
        print("1) Cap 적용 방식 (dataset_random_split.apply_sample_caps)")
        print("=" * 72)
        print(
            """
  ┌─────────────────────────────────────────────────────────────────────┐
  │ DISEASE_CAPS (JSON)     → 질환 **전체** 단위 cap                      │
  │   key: disease:{질환명}   limit: 해당 질환 샘플 합 (모든 severity 합산)   │
  │   예: {"핵경화": 7000} → 핵경화 무+유 합쳐 최대 7000장                  │
  ├─────────────────────────────────────────────────────────────────────┤
  │ MAX_PER_CLASS (env)     → stratum **클래스** 단위 cap                 │
  │   stratum = "{질환}_{label_idx}"  (예: 백내장_0, 백내장_1, …)         │
  │   key: stratum:{질환}_{label}  limit: MAX_PER_CLASS                   │
  │   ※ 질환당 최대 ≈ (클래스 수) × MAX_PER_CLASS                         │
  │     · 2-class (핵경화): 최대 2 × cap                                  │
  │     · 4-class (백내장): 최대 4 × cap  → 구조적으로 2배 여지           │
  └─────────────────────────────────────────────────────────────────────┘

  EyeDiseaseDataset._collect_samples (dataset.py) 1차 cap:
    DATASET_PRIMARY_CAP (기본 50000) — stratum당, apply_sample_caps 이전.

  학습 파이프라인 순서: TL 수집 → 1차 cap → apply_sample_caps → train/val split
"""
        )
        print(f"  현재 설정: MAX_PER_CLASS={max_per_class or '(미설정)'}")
        print(f"             DISEASE_CAPS={disease_caps or '(미설정)'}")


def _structural_max_per_disease(
    label_map: Mapping[str, Mapping[str, int]],
    max_per_class: Optional[int],
    disease_caps: Dict[str, int],
) -> Dict[str, int]:
    """이론상 cap만으로 허용되는 질환별 최대 샘플 수."""
    out: Dict[str, int] = {}
    for disease, severity_map in label_map.items():
        n_classes = len(severity_map)
        if disease in disease_caps:
            out[disease] = disease_caps[disease]
        elif max_per_class:
            out[disease] = n_classes * max_per_class
        else:
            out[disease] = -1
    return out


def _count_split(
    metas: Sequence[SampleMeta],
    indices: Sequence[int],
    diseases: Sequence[str],
    label_map: Mapping[str, Mapping[str, int]],
) -> Dict[str, Dict[str, object]]:
    idx_set = set(indices)
    subset = [m for m in metas if m.index in idx_set]

    result: Dict[str, Dict[str, object]] = {}
    for disease in diseases:
        names = _label_names(label_map, disease)
        class_counts: Counter[int] = Counter()
        for m in subset:
            if m.disease == disease:
                class_counts[m.label] += 1

        normal = class_counts.get(0, 0)
        abnormal = sum(c for lbl, c in class_counts.items() if lbl > 0)
        per_class = {names.get(lbl, f"cls{lbl}"): class_counts.get(lbl, 0) for lbl in sorted(names)}

        result[disease] = {
            "class_counts": class_counts,
            "per_class_named": per_class,
            "normal": normal,
            "abnormal": abnormal,
            "total": normal + abnormal,
            "n_classes": len(names),
        }
    return result


def _print_distribution_table(
    title: str,
    counts: Dict[str, Dict[str, object]],
    diseases: Sequence[str],
) -> None:
    print(f"\n{'=' * 72}")
    print(title)
    print("=" * 72)
    hdr = f"{'질환':<14} {'클래스수':>6} {'클래스별 카운트':<36} {'정상(무)':>8} {'비정상합':>8} {'합계':>8}"
    print(hdr)
    print("-" * len(hdr))

    for disease in diseases:
        c = counts[disease]
        per = c["per_class_named"]
        per_str = ", ".join(f"{k}={v:,}" for k, v in per.items())
        if len(per_str) > 34:
            per_str = per_str[:31] + "..."
        print(
            f"{disease:<14} {c['n_classes']:>6} {per_str:<36} "
            f"{c['normal']:>8,} {c['abnormal']:>8,} {c['total']:>8,}"
        )


def _print_abnormal_comparison(
    title: str,
    counts: Dict[str, Dict[str, object]],
    diseases: Sequence[str],
    ref_disease: str = REF_DISEASE,
) -> Tuple[int, int, float]:
    print(f"\n{'=' * 72}")
    print(title)
    print("=" * 72)

    ref_abn = counts.get(ref_disease, {}).get("abnormal", 0)
    if not ref_abn:
        ref_abn = 1  # avoid div0 in display; conclusion uses real values

    print(f"{'질환':<14} {'비정상 n':>10} {'백내장 대비':>12} {'구조 max/cap':>14}")
    print("-" * 54)

    abn_values: List[Tuple[str, int]] = []
    for disease in diseases:
        abn = int(counts[disease]["abnormal"])
        abn_values.append((disease, abn))
        ratio = abn / ref_abn if ref_abn else float("inf")
        n_cls = counts[disease]["n_classes"]
        struct_hint = f"{n_cls}×cap"
        marker = " ◀ ref" if disease == ref_disease else ""
        print(f"{disease:<14} {abn:>10,} {ratio:>11.2f}x {struct_hint:>14}{marker}")

    abn_only = [v for _, v in abn_values if v > 0]
    max_abn = max(abn_only) if abn_only else 0
    min_abn = min(abn_only) if abn_only else 0
    max_d = max(abn_values, key=lambda x: x[1])[0] if abn_values else ""
    min_d = min((x for x in abn_values if x[1] > 0), key=lambda x: x[1], default=("", 0))[0]

    real_ref = int(counts.get(ref_disease, {}).get("abnormal", 0))
    nuclear = int(counts.get("핵경화", {}).get("abnormal", 0))
    if real_ref and nuclear:
        print(f"\n  ★ 핵심: {ref_disease} 비정상 {real_ref:,} / 핵경화 비정상 {nuclear:,} "
              f"= {real_ref / nuclear:.2f}배")

    return max_abn, min_abn, (max_abn / min_abn if min_abn > 0 else float("inf"))


def _print_cap_stats(cap_stats: Dict[str, object]) -> None:
    if not cap_stats:
        print("\n  (2차 cap 미적용 — MAX_PER_CLASS·DISEASE_CAPS 모두 비어 있음)")
        return
    print(f"\n{'=' * 72}")
    print("2차 cap 적용 상세")
    print("=" * 72)
    for key, st in sorted(cap_stats.items()):
        if not isinstance(st, dict):
            print(f"  [{key}] {st}")
            continue

        # apply_sample_caps / apply_disease_balanced_caps 공통 상세 항목
        b = st.get("before")
        a = st.get("after")
        lim = st.get("limit")
        if b is not None and a is not None and lim is not None:
            hit = " ✂️" if b != a else ""
            print(f"  [{key}] limit={lim:,}: {b:,} → {a:,}{hit}")
            continue

        # disease_balanced summary 항목 (normal/abnormal 집계)
        if "normal" in st and "abnormal" in st:
            n = int(st.get("normal", 0))
            abn = int(st.get("abnormal", 0))
            labels = int(st.get("abnormal_labels", 0))
            dlim = st.get("disease_limit", "N/A")
            total = n + abn
            if isinstance(dlim, int):
                dlim_str = f"{dlim:,}"
            else:
                dlim_str = str(dlim)
            print(
                f"  [{key}] disease_limit={dlim_str}: "
                f"정상 {n:,} + 비정상 {abn:,} (severity={labels}) = {total:,}"
            )
            continue

        # 알 수 없는 구조도 안전하게 표시
        payload = ", ".join(f"{k}={v}" for k, v in sorted(st.items()))
        print(f"  [{key}] {payload}")


def load_capped_metas(
    animal_type: str,
    *,
    max_per_class: Optional[int],
    disease_caps: Dict[str, int],
    seed: int,
    cap_mode: Optional[str] = None,
) -> Tuple[List[SampleMeta], Dict[str, object], List[SampleMeta]]:
    """TL → metadata → 2차 cap. 반환: (capped_metas, cap_stats, pre_cap_metas)."""
    mode = cap_mode or resolve_cap_mode()
    tl_paths = get_tl_paths(animal_type)
    base = EyeDiseaseDataset(
        data_paths=tl_paths,
        animal_type=animal_type,
        transform=None,
        is_training=False,
    )
    metas = build_sample_metadata(base)
    pre_cap = list(metas)

    if mode == "disease_balanced":
        limit = resolve_disease_balanced_limit(max_per_class=max_per_class)
        preserve = resolve_preserve_smartphone()
        metas, cap_stats = apply_disease_balanced_caps(
            metas,
            disease_limit=limit,
            seed=seed,
            preserve_smartphone=preserve,
        )
    elif max_per_class or disease_caps:
        metas, cap_stats = apply_sample_caps(
            metas,
            max_per_class=max_per_class,
            disease_caps=disease_caps,
            seed=seed,
        )
    else:
        cap_stats = {}

    return metas, cap_stats, pre_cap


def run_analysis(animal_type: str) -> None:
    seed = int(os.environ.get("SPLIT_SEED", "42"))
    val_ratio = float(os.environ.get("VAL_RATIO", "0.2"))
    cap_mode = resolve_cap_mode()
    max_per_class = resolve_max_per_class()
    disease_caps = resolve_disease_caps()
    disease_limit = resolve_disease_balanced_limit(max_per_class=max_per_class)
    preserve_sp = resolve_preserve_smartphone()

    label_map = DOG_LABEL_MAP if animal_type == "dog" else CAT_LABEL_MAP
    diseases = list(label_map.keys())

    print("\n" + "#" * 72)
    print(f"# analyze_cap_distribution | ANIMAL_TYPE={animal_type}")
    print(f"# CAP_MODE={cap_mode}  SPLIT_SEED={seed}  VAL_RATIO={val_ratio}")
    print("#" * 72)

    print_cap_mechanism(
        max_per_class,
        disease_caps,
        cap_mode=cap_mode,
        disease_limit=disease_limit if cap_mode == "disease_balanced" else None,
        preserve_smartphone=preserve_sp,
    )

    if cap_mode == "stratum":
        struct_max = _structural_max_per_disease(label_map, max_per_class, disease_caps)
        if max_per_class or disease_caps:
            print("\n  이론상 질환별 cap 상한 (2차 cap만, 모든 클래스가 limit에 도달 가정):")
            for d in diseases:
                mx = struct_max[d]
                n_cls = len(label_map[d])
                if mx < 0:
                    print(f"    {d}: 무제한 ({n_cls}-class)")
                else:
                    print(f"    {d}: {mx:,} ({n_cls}-class × cap)" + (
                        f"  ← 2-class 대비 {n_cls / 2:.1f}×" if n_cls != 2 else ""
                    ))
    elif cap_mode == "disease_balanced":
        print(f"\n  disease_balanced: 모든 질환 비정상/정상 각 ~{disease_limit:,} 상한")

    metas, cap_stats, pre_cap = load_capped_metas(
        animal_type,
        max_per_class=max_per_class,
        disease_caps=disease_caps,
        seed=seed,
        cap_mode=cap_mode,
    )
    _print_cap_stats(cap_stats)

    train_idx, val_idx, split_meta = split_indices_from_metas(
        metas, val_ratio=val_ratio, seed=seed,
    )
    print(f"\n  Split: {split_meta['method']}  train={split_meta['train_size']:,}  "
          f"val={split_meta['val_size']:,}  (pre-cap total={len(pre_cap):,} → post-cap={len(metas):,})")

    train_counts = _count_split(metas, train_idx, diseases, label_map)
    val_counts = _count_split(metas, val_idx, diseases, label_map)

    _print_distribution_table(
        f"2) Train set 분포 (cap 적용 후, 실제 학습 샘플) — n={len(train_idx):,}",
        train_counts,
        diseases,
    )
    train_max, train_min, train_ratio = _print_abnormal_comparison(
        "3) Train — 비정상 샘플 비교 (백내장 기준 배율)",
        train_counts,
        diseases,
    )

    _print_distribution_table(
        f"4) Val set 분포 (동일 cap·split) — n={len(val_idx):,}",
        val_counts,
        diseases,
    )
    val_max, val_min, val_ratio = _print_abnormal_comparison(
        "5) Val — 비정상 샘플 비교 (백내장 기준 배율)",
        val_counts,
        diseases,
    )

    train_abn_metas = _filter_metas(metas, train_idx, abnormal_only=True)
    device_stats = _print_device_aware_section(
        pre_cap, metas, train_abn_metas, diseases,
    )

    print(f"\n{'=' * 72}")
    print("7) 결론")
    print("=" * 72)

    ref_train = int(train_counts.get(REF_DISEASE, {}).get("abnormal", 0))
    ref_val = int(val_counts.get(REF_DISEASE, {}).get("abnormal", 0))
    nuc_train = int(train_counts.get("핵경화", {}).get("abnormal", 0))
    nuc_val = int(val_counts.get("핵경화", {}).get("abnormal", 0))

    g_ret = device_stats["global_retention"]
    g_ver = device_stats["global_verdict"]
    mean_ret = device_stats["mean_disease_retention"]
    ref_dev = device_stats["per_disease"].get(REF_DISEASE, {})
    ref_sp_ret = ref_dev.get("retention", float("nan"))
    ref_sp_ret_str = (
        f"{ref_sp_ret * 100:.1f}%"
        if isinstance(ref_sp_ret, float) and ref_sp_ret == ref_sp_ret
        else "해당 없음 (원본 SP+비정상 0건)"
    )

    zero_sp = device_stats.get("zero_sp_diseases", [])
    zero_sp_str = ", ".join(zero_sp) if zero_sp else "(없음)"
    has_sp_parts = [
        f"{d}({int(device_stats['per_disease'][d]['pre_sp']):,})"
        for d in diseases
        if d not in zero_sp and device_stats.get("per_disease", {}).get(d, {}).get("pre_sp", 0) > 0
    ]
    has_sp_str = ", ".join(has_sp_parts) if has_sp_parts else "(없음)"

    print(f"""
  [A] Cap 단위 · 클래스 불균형
    · CAP_MODE={cap_mode}
    · Train 비정상 최대/최소: {train_max:,} / {train_min:,} = {train_ratio:.2f}배
    · {REF_DISEASE}/핵경화 (train): {(ref_train / nuc_train if nuc_train else float('nan')):.2f}배
    · {REF_DISEASE}/핵경화 (val):   {(ref_val / nuc_val if nuc_val else float('nan')):.2f}배

  [B] Device · 원본(pre-cap)부터의 질환×device 공백
    · 원본 SP+비정상=0 질환 ({len(zero_sp)}/{len(diseases)}): {zero_sp_str}
    · → cap과 무관하게 **수집 단계부터** SP 비정상이 없는 질환 존재
    · SP+비정상 > 0 질환: {has_sp_str}

  [C] Device · cap이 SP+비정상에 미친 영향 (원본>0 질환만)
    · 전역 SP+비정상 보존율: {g_ret * 100:.1f}%  ({device_stats['pre_sp_abn']:,} → {device_stats['post_sp_abn']:,})
    · 전역 SP 비율(비정상 중): {device_stats['pre_ratio'] * 100:.2f}% → {device_stats['post_ratio'] * 100:.2f}%
      (Δ {(device_stats['post_ratio'] - device_stats['pre_ratio']) * 100:+.2f}pp)
    · SP>0 질환 보존율 평균: {mean_ret * 100:.1f}%
    · {REF_DISEASE} SP+비정상: {ref_sp_ret_str}
    · 전역 판정: {g_ver}

  [D] 종합
    · device shortcut: 원본 비정상의 SP 비율 {device_stats['pre_ratio'] * 100:.1f}% — cap 이전부터 SP 학습 불리
    · cap은 SP>0 질환에서 추가 ~{(1 - mean_ret) * 100 if mean_ret == mean_ret else float('nan'):.0f}% 손실 → (c) 악화
    · {REF_DISEASE} 과예측: (1) stratum당 cap→4× 슬롯 (2) 원본 SP=0 → cap과 별개 이슈
""")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="5k cap 후 train/val 분포 진단")
    p.add_argument("--animal", choices=("dog", "cat"), default=None)
    return p.parse_args()


def main() -> None:
    args = parse_args()
    animal = (args.animal or os.environ.get("ANIMAL_TYPE", "dog")).strip().lower()
    if animal not in ("dog", "cat"):
        raise SystemExit(f"ANIMAL_TYPE must be dog|cat: {animal}")
    run_analysis(animal)


if __name__ == "__main__":
    main()
