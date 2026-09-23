"""Compatibility entry point for the canonical static-site builder."""
from pathlib import Path
import subprocess

if __name__ == '__main__':
    subprocess.run(['node', 'scripts/build.mjs'], cwd=Path(__file__).resolve().parents[1], check=True)
