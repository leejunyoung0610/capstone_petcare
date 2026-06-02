"""
멀티태스크 + 10-class 질환 감별 softmax 동시 학습.

Head A: 질환별 per-disease CE (기존)
Head B: discrimination CE — 비정상 샘플만 (정상 mask)

실행 (프로젝트 루트):
  CAP_MODE=disease_balanced PRESERVE_SMARTPHONE=true SPLIT_SEED=42 \\
    ANIMAL_TYPE=dog python models/classifier/train_multitask_softmax.py

환경변수:
  BINARY_LOSS_WEIGHT=1.0  DISC_LOSS_WEIGHT=1.0
  INIT_FROM_CHECKPOINT=auto|path|off  — auto: dog_best_balanced_cap.pth
  PHASE1_EPOCHS=4  PHASE2_EPOCHS=12
"""

from __future__ import annotations

import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.amp import GradScaler, autocast
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import DataLoader
from tqdm import tqdm

from models.classifier.dataset_random_split import (
    RandomSplitEyeDataset,
    create_random_split_dataloaders,
)
from models.classifier.losses import build_per_disease_losses
from models.classifier.model_multitask_softmax import (
    create_multitask_softmax_model,
    load_partial_checkpoint,
)
from models.classifier.multitask_softmax_common import (
    DISCRIM_KEY,
    SoftmaxMultitaskConfig,
    attach_discrimination_labels,
    binary_gt_abnormal,
    binary_pred_abnormal,
)
from models.classifier.random_split_common import (
    active_disease_and_label,
    rank_diseases_by_abnormal_prob,
)
from models.classifier.train import (
    _build_metrics,
    _build_optimizer,
    _init_disease_stats,
    _mean_disease_metric,
    _print_disease_metrics,
    _update_recall_stats,
    get_device,
    resolve_batch_size,
    resolve_num_workers,
)
from models.classifier.model import count_parameters
from models.classifier.train_common import create_ema, ema_state_dict
from models.classifier.train_random_split import (
    _monitor_cataract_top3,
    evaluate_device_subsets,
)


def _resolve_init_checkpoint(config: SoftmaxMultitaskConfig, animal: str) -> str:
    raw = config.INIT_FROM_CHECKPOINT
    if raw.lower() in ("0", "false", "no", "off", ""):
        return ""
    if raw.lower() == "auto":
        candidates = [
            os.path.join(config.OUTPUT_DIR, f"{animal}_best_balanced_cap.pth"),
            os.path.join(config.OUTPUT_DIR, f"{animal}_best_random_split.pth"),
        ]
        for p in candidates:
            if os.path.isfile(p):
                return p
        return ""
    return raw if os.path.isfile(raw) else ""


def _run_forward_loss_softmax(
    model: nn.Module,
    criterion_dict: nn.ModuleDict,
    disc_criterion: nn.CrossEntropyLoss,
    images: torch.Tensor,
    labels: dict,
    diseases: List[str],
    device: str,
    *,
    binary_weight: float,
    disc_weight: float,
) -> Tuple[torch.Tensor, dict, dict, dict, dict, float, float]:
    labels = attach_discrimination_labels(labels, diseases)
    outputs = model(images)

    loss = torch.tensor(0.0, device=device)
    disease_losses: Dict[str, float] = {}
    disease_corrects: Dict[str, int] = {}
    disease_totals: Dict[str, int] = {}
    recall_stats = {d: defaultdict(int) for d in diseases}

    binary_loss_sum = 0.0
    for disease in diseases:
        disease_labels = labels[disease].to(device)
        valid_mask = disease_labels >= 0
        if valid_mask.sum() == 0:
            continue
        valid_labels = disease_labels[valid_mask]
        valid_outputs = outputs[disease][valid_mask]
        dloss = criterion_dict[disease](valid_outputs, valid_labels)
        binary_loss_sum += dloss.item() * int(valid_mask.sum().item())
        loss = loss + binary_weight * dloss
        n = int(valid_mask.sum().item())
        disease_losses[disease] = dloss.item() * n
        _, preds = torch.max(valid_outputs, 1)
        disease_corrects[disease] = int((preds == valid_labels).sum().item())
        disease_totals[disease] = n
        _update_recall_stats(recall_stats, disease, preds, valid_labels)

    disc_loss_val = 0.0
    disc_labels = labels[DISCRIM_KEY].to(device)
    disc_mask = disc_labels >= 0
    if disc_mask.sum() > 0:
        disc_out = outputs[DISCRIM_KEY][disc_mask]
        disc_tgt = disc_labels[disc_mask]
        dloss = disc_criterion(disc_out, disc_tgt)
        disc_loss_val = dloss.item()
        loss = loss + disc_weight * dloss

    return (
        loss,
        disease_losses,
        disease_corrects,
        disease_totals,
        recall_stats,
        binary_loss_sum,
        disc_loss_val,
    )


def _train_epoch_softmax(
    model: nn.Module,
    dataloader: DataLoader,
    criterion_dict: nn.ModuleDict,
    disc_criterion: nn.CrossEntropyLoss,
    optimizer: optim.Optimizer,
    device: str,
    diseases: List[str],
    config: SoftmaxMultitaskConfig,
    *,
    use_amp: bool = False,
    scaler: Optional[GradScaler] = None,
    grad_accum_steps: int = 1,
    ema=None,
) -> Dict[str, float]:
    model.train()
    total_loss = 0.0
    d_losses, d_corrects, d_totals, d_recall = _init_disease_stats(diseases)
    merged_recall = {d: defaultdict(int) for d in diseases}
    disc_correct = 0
    disc_total = 0

    optimizer.zero_grad(set_to_none=True)
    progress = tqdm(dataloader, desc="Training")

    for step, (images, labels) in enumerate(progress, start=1):
        images = images.to(device)
        labels = attach_discrimination_labels(labels, diseases)

        with autocast("cuda", enabled=use_amp):
            loss, batch_d_losses, batch_d_corrects, batch_d_totals, batch_recall, _, _ = (
                _run_forward_loss_softmax(
                    model,
                    criterion_dict,
                    disc_criterion,
                    images,
                    labels,
                    diseases,
                    device,
                    binary_weight=config.BINARY_LOSS_WEIGHT,
                    disc_weight=config.DISC_LOSS_WEIGHT,
                )
            )

        if use_amp and scaler is not None:
            scaler.scale(loss / grad_accum_steps).backward()
        else:
            (loss / grad_accum_steps).backward()

        if step % grad_accum_steps == 0 or step == len(dataloader):
            if use_amp and scaler is not None:
                scaler.step(optimizer)
                scaler.update()
            else:
                optimizer.step()
            optimizer.zero_grad(set_to_none=True)
            if ema is not None:
                ema.update(model)

        total_loss += loss.item()
        for d in diseases:
            d_losses[d] += batch_d_losses.get(d, 0.0)
            d_corrects[d] += batch_d_corrects.get(d, 0)
            d_totals[d] += batch_d_totals.get(d, 0)
            for cls, cnt in batch_recall[d].items():
                merged_recall[d][cls] += cnt

        with torch.no_grad():
            outputs = model(images)
            disc_labels = labels[DISCRIM_KEY]
            mask = disc_labels >= 0
            if mask.sum() > 0:
                preds = outputs[DISCRIM_KEY][mask].argmax(dim=1)
                disc_correct += int((preds == disc_labels[mask].to(device)).sum().item())
                disc_total += int(mask.sum().item())

        progress.set_postfix(loss=f"{loss.item():.4f}")

    metrics = _build_metrics(total_loss, len(dataloader), d_losses, d_corrects, d_totals, merged_recall, diseases)
    if disc_total > 0:
        metrics["disc_acc"] = disc_correct / disc_total
    return metrics


@torch.no_grad()
def _validate_epoch_softmax(
    model: nn.Module,
    dataloader: DataLoader,
    criterion_dict: nn.ModuleDict,
    disc_criterion: nn.CrossEntropyLoss,
    device: str,
    diseases: List[str],
    config: SoftmaxMultitaskConfig,
    *,
    use_amp: bool = False,
    ema=None,
) -> Dict[str, float]:
    eval_m = ema.module if ema is not None else model
    eval_m.eval()
    total_loss = 0.0
    d_losses, d_corrects, d_totals, d_recall = _init_disease_stats(diseases)
    merged_recall = {d: defaultdict(int) for d in diseases}
    disc_correct = 0
    disc_total = 0
    binary_correct = 0
    binary_total = 0

    for images, labels in tqdm(dataloader, desc="Validation"):
        images = images.to(device)
        labels = attach_discrimination_labels(labels, diseases)

        with autocast("cuda", enabled=use_amp):
            loss, batch_d_losses, batch_d_corrects, batch_d_totals, batch_recall, _, _ = (
                _run_forward_loss_softmax(
                    eval_m,
                    criterion_dict,
                    disc_criterion,
                    images,
                    labels,
                    diseases,
                    device,
                    binary_weight=config.BINARY_LOSS_WEIGHT,
                    disc_weight=config.DISC_LOSS_WEIGHT,
                )
            )

        total_loss += loss.item()
        for d in diseases:
            d_losses[d] += batch_d_losses.get(d, 0.0)
            d_corrects[d] += batch_d_corrects.get(d, 0)
            d_totals[d] += batch_d_totals.get(d, 0)
            for cls, cnt in batch_recall[d].items():
                merged_recall[d][cls] += cnt

        outputs = eval_m(images)
        bs = images.size(0)
        for i in range(bs):
            binary_total += 1
            gt_abn = binary_gt_abnormal(labels, i, diseases)
            pred_abn = binary_pred_abnormal(outputs, i, diseases)
            binary_correct += int(gt_abn == pred_abn)

            dl = labels[DISCRIM_KEY][i].item()
            if dl >= 0:
                pred = outputs[DISCRIM_KEY][i].argmax().item()
                disc_correct += int(pred == dl)
                disc_total += 1

    metrics = _build_metrics(total_loss, len(dataloader), d_losses, d_corrects, d_totals, merged_recall, diseases)
    metrics["binary_acc"] = binary_correct / binary_total if binary_total else 0.0
    if disc_total > 0:
        metrics["disc_acc"] = disc_correct / disc_total
    return metrics


def _run_phase_softmax(
    *,
    phase: int,
    epochs: int,
    global_epoch_start: int,
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    criterion_dict: nn.ModuleDict,
    disc_criterion: nn.CrossEntropyLoss,
    optimizer: optim.Optimizer,
    scheduler: CosineAnnealingLR,
    device: str,
    diseases: List[str],
    config: SoftmaxMultitaskConfig,
    use_amp: bool,
    scaler: Optional[GradScaler],
    history: dict,
    best_val_loss: float,
    patience_counter: int,
    best_path: str,
    ema=None,
    val_ds: Optional[RandomSplitEyeDataset] = None,
) -> Tuple[float, int, str, int]:
    print(f"\n{'=' * 60}")
    print(
        f"Phase {phase}: "
        f"{'헤드만 (per-disease + discrimination)' if phase == 1 else '전체 fine-tune'}"
    )
    print(f"  loss = {config.BINARY_LOSS_WEIGHT}×HeadA + {config.DISC_LOSS_WEIGHT}×HeadB")
    print(f"{'=' * 60}")

    last_epoch = global_epoch_start
    for local_ep in range(1, epochs + 1):
        global_epoch = global_epoch_start + local_ep
        last_epoch = global_epoch
        print(f"\nEpoch {global_epoch} (Phase {phase} {local_ep}/{epochs})")

        train_metrics = _train_epoch_softmax(
            model, train_loader, criterion_dict, disc_criterion, optimizer,
            device, diseases, config, use_amp=use_amp, scaler=scaler, ema=ema,
        )
        val_metrics = _validate_epoch_softmax(
            model, val_loader, criterion_dict, disc_criterion,
            device, diseases, config, use_amp=use_amp, ema=ema,
        )
        scheduler.step()

        train_acc = _mean_disease_metric(train_metrics, "_acc")
        val_acc = _mean_disease_metric(val_metrics, "_acc")
        print(f"[Train] loss={train_metrics['loss']:.4f}  head_mean_acc={train_acc:.4f}")
        print(
            f"[Val]   loss={val_metrics['loss']:.4f}  head_mean_acc={val_acc:.4f}  "
            f"binary_acc={val_metrics.get('binary_acc', 0):.4f}  "
            f"disc_acc={val_metrics.get('disc_acc', 0):.4f}"
        )
        _print_disease_metrics("[Val]", val_metrics, diseases)

        if val_ds is not None and "백내장" in diseases:
            ct3 = _monitor_cataract_top3(model, val_ds, val_loader, diseases, device, ema=ema)
            print(f"  [Monitor] 백내장 Top-3 (binary rank): {ct3 * 100:.2f}%")

        history["epochs"].append({
            "epoch": global_epoch,
            "phase": phase,
            "val_loss": val_metrics["loss"],
            "val_acc_mean": val_acc,
            "val_binary_acc": val_metrics.get("binary_acc"),
            "val_disc_acc": val_metrics.get("disc_acc"),
        })

        if val_metrics["loss"] < best_val_loss:
            best_val_loss = val_metrics["loss"]
            patience_counter = 0
            torch.save({
                "epoch": global_epoch,
                "phase": phase,
                "model_state_dict": ema_state_dict(ema, model),
                "val_loss": val_metrics["loss"],
                "val_acc_mean": val_acc,
                "val_binary_acc": val_metrics.get("binary_acc"),
                "val_disc_acc": val_metrics.get("disc_acc"),
                "task": "multitask_softmax",
                "animal_type": config.ANIMAL_TYPE,
                "binary_loss_weight": config.BINARY_LOSS_WEIGHT,
                "disc_loss_weight": config.DISC_LOSS_WEIGHT,
            }, best_path)
            print(f"✓ Best 저장: {best_path}")
        else:
            patience_counter += 1
            if patience_counter >= config.PATIENCE:
                print(f"Early stopping (patience={config.PATIENCE})")
                return best_val_loss, patience_counter, best_path, last_epoch

    return best_val_loss, patience_counter, best_path, last_epoch


def train() -> None:
    config = SoftmaxMultitaskConfig()
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)

    print("=" * 64)
    print("멀티태스크 + Softmax 질환 감별 학습")
    print("=" * 64)
    print(f"  CAP_MODE={config.CAP_MODE}  SPLIT_SEED={config.SPLIT_SEED}")
    print(f"  BINARY_W={config.BINARY_LOSS_WEIGHT}  DISC_W={config.DISC_LOSS_WEIGHT}")

    device = get_device()
    batch_size = resolve_batch_size(config.BATCH_SIZE)
    num_workers = resolve_num_workers(device, config.NUM_WORKERS)
    use_amp = device == "cuda"
    scaler = GradScaler("cuda") if use_amp else None

    train_loader, val_loader, train_ds, val_ds, split_meta = create_random_split_dataloaders(
        config.ANIMAL_TYPE,
        batch_size=batch_size,
        img_size=config.IMG_SIZE,
        num_workers=num_workers,
        use_sampler=False,
        pin_memory=device == "cuda",
    )

    model = create_multitask_softmax_model(
        config.ANIMAL_TYPE, pretrained=True, head_dropout=config.HEAD_DROPOUT,
    ).to(device)

    init_ckpt = _resolve_init_checkpoint(config, config.ANIMAL_TYPE)
    if init_ckpt:
        load_partial_checkpoint(model, init_ckpt, device)

    ema = create_ema(model, device)
    diseases = model.get_disease_names()

    criterion_dict = build_per_disease_losses(
        train_ds, diseases, config.LOSS_TYPE,
        device=device, use_class_weights=config.USE_CLASS_WEIGHTS,
        focal_gamma=config.FOCAL_GAMMA, label_smoothing=config.LABEL_SMOOTHING,
    ).to(device)

    disc_criterion = nn.CrossEntropyLoss(label_smoothing=config.LABEL_SMOOTHING).to(device)

    best_path = config.best_checkpoint(config.ANIMAL_TYPE)
    history = {"task": "multitask_softmax", "split_meta": split_meta, "epochs": []}
    best_val_loss = float("inf")
    patience_counter = 0
    last_epoch = 0

    if config.PHASE1_EPOCHS > 0:
        opt = _build_optimizer(model, phase=1, config=config)
        sched = CosineAnnealingLR(opt, T_max=config.PHASE1_EPOCHS)
        best_val_loss, patience_counter, best_path, last_epoch = _run_phase_softmax(
            phase=1, epochs=config.PHASE1_EPOCHS, global_epoch_start=0,
            model=model, train_loader=train_loader, val_loader=val_loader,
            criterion_dict=criterion_dict, disc_criterion=disc_criterion,
            optimizer=opt, scheduler=sched, device=device, diseases=diseases,
            config=config, use_amp=use_amp, scaler=scaler, history=history,
            best_val_loss=best_val_loss, patience_counter=patience_counter,
            best_path=best_path, ema=ema, val_ds=val_ds,
        )
        if patience_counter >= config.PATIENCE:
            patience_counter = 0

    if config.PHASE2_EPOCHS > 0 and patience_counter < config.PATIENCE:
        opt = _build_optimizer(model, phase=2, config=config)
        sched = CosineAnnealingLR(opt, T_max=config.PHASE2_EPOCHS)
        best_val_loss, patience_counter, best_path, last_epoch = _run_phase_softmax(
            phase=2, epochs=config.PHASE2_EPOCHS, global_epoch_start=last_epoch,
            model=model, train_loader=train_loader, val_loader=val_loader,
            criterion_dict=criterion_dict, disc_criterion=disc_criterion,
            optimizer=opt, scheduler=sched, device=device, diseases=diseases,
            config=config, use_amp=use_amp, scaler=scaler, history=history,
            best_val_loss=best_val_loss, patience_counter=patience_counter,
            best_path=best_path, ema=ema, val_ds=val_ds,
        )

    ckpt = torch.load(best_path, map_location=device, weights_only=False)
    model.load_state_dict(ckpt["model_state_dict"])
    device_report = evaluate_device_subsets(model, val_ds, val_loader, diseases, device)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    hist_path = Path(config.OUTPUT_DIR) / f"train_history_multitask_softmax_{config.ANIMAL_TYPE}_{ts}.json"
    history["device_eval"] = device_report
    history["best_checkpoint"] = best_path
    with open(hist_path, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)
    print(f"\n✓ History: {hist_path}")
    print(f"✓ Best: {best_path}")


if __name__ == "__main__":
    train()
