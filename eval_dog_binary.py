import torch
from models.classifier.model import create_model
from models.classifier.dataset import create_dataloader
from collections import defaultdict

device = 'cpu'
model = create_model('dog', pretrained=False)
ckpt = torch.load('models/classifier/checkpoints/dog_best.pth', map_location='cpu')
model.load_state_dict(ckpt['model_state_dict'])
model = model.to(device)
model.eval()

val_loader = create_dataloader(
    data_paths=['eye_data/VL/개/안구/일반'],
    animal_type='dog',
    batch_size=32,
    img_size=224,
    is_training=False,
    num_workers=0,
    use_sampler=False
)

diseases = model.get_disease_names()
bc = defaultdict(int)
tot = defaultdict(int)

with torch.no_grad():
    for images, labels in val_loader:
        images = images.to(device)
        outputs = model(images)
        for d in diseases:
            dl = labels[d].to(device)
            v = dl >= 0
            if v.sum() == 0:
                continue
            preds = torch.argmax(outputs[d][v], dim=1)
            gt = dl[v]
            pred_b = (preds > 0).long()
            gt_b = (gt > 0).long()
            bc[d] += (pred_b == gt_b).sum().item()
            tot[d] += v.sum().item()

print('이진분류 정확도 (유/무):')
for d in diseases:
    acc = bc[d] / tot[d] * 100 if tot[d] > 0 else 0
    print(f'{d:15s} {acc:.1f}%')
