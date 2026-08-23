#!/usr/bin/env python3
"""Start the Scratch AI development server on macOS."""

import shutil
import subprocess
import sys
import time
from urllib.error import URLError
import urllib.request
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
URL = "http://localhost:5173/"


def wait_for_server(process, timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if process.poll() is not None:
            return False
        try:
            with urllib.request.urlopen(URL, timeout=1):
                return True
        except (OSError, URLError):
            time.sleep(1)
    return False


def main():
    if shutil.which("node") is None or shutil.which("npm") is None:
        print("Node.js/npmが見つかりません。Node.js v24.19.0 LTSをインストールしてください。")
        print("https://nodejs.org/en/download/")
        input("Enterキーで終了します...")
        return 1

    if not (ROOT / "node_modules").exists():
        print("先にnpm ciを実行して依存関係をインストールしてください。")
        print(f"cd {ROOT}")
        print("npm ci")
        input("Enterキーで終了します...")
        return 1

    command = [
        "npm",
        "--workspace",
        "@scratch/scratch-gui",
        "run",
        "start",
        "--",
        "--host",
        "127.0.0.1",
        "--port",
        "5173",
    ]

    print("Scratch AIを起動しています...")
    process = subprocess.Popen(command, cwd=ROOT)
    if wait_for_server(process):
        print(f"ブラウザで {URL} を開きます。")
        webbrowser.open(URL)
        print("終了するには、この画面でCtrl+Cを押してください。")
    else:
        print("サーバーの起動に失敗しました。表示されたエラーを確認してください。")

    try:
        return process.wait()
    except KeyboardInterrupt:
        process.terminate()
        return 0


if __name__ == "__main__":
    sys.exit(main())
