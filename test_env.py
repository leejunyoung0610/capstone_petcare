#!/usr/bin/env python3
"""
환경 설정 확인 스크립트
"""
import sys

def test_environment():
    print("=" * 60)
    print("환경 설정 테스트")
    print("=" * 60)
    
    # Python 버전 확인
    print(f"\n✓ Python 버전: {sys.version}")
    print(f"✓ Python 경로: {sys.executable}")
    
    # PyTorch 확인
    try:
        import torch
        print(f"\n✓ PyTorch 버전: {torch.__version__}")
        print(f"✓ MPS 빌드됨: {torch.backends.mps.is_built()}")
        print(f"✓ MPS 사용 가능: {torch.backends.mps.is_available()}")
        
        if torch.backends.mps.is_available():
            device = "mps"
            print(f"✓ 사용할 디바이스: {device} (Apple Silicon GPU 가속)")
        else:
            device = "cpu"
            print(f"⚠ 사용할 디바이스: {device} (MPS 사용 불가)")
    except ImportError as e:
        print(f"✗ PyTorch 설치 안 됨: {e}")
        return False
    
    # 주요 패키지 확인
    packages = {
        'torchvision': '비전 모델',
        'timm': 'EfficientNet',
        'albumentations': '데이터 증강',
        'pytorch_grad_cam': 'GradCAM',
        'fastapi': 'API 서버',
        'boto3': 'AWS S3',
        'wandb': '실험 추적',
        'onnx': '모델 변환'
    }
    
    print(f"\n패키지 설치 확인:")
    print("-" * 60)
    
    for package, description in packages.items():
        try:
            __import__(package)
            print(f"✓ {package:20s} - {description}")
        except ImportError:
            print(f"✗ {package:20s} - {description} (설치 안 됨)")
    
    print("\n" + "=" * 60)
    print("환경 설정 완료!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_environment()
    sys.exit(0 if success else 1)
