#!/bin/zsh

cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
    echo "Python 3が見つかりません。https://www.python.org/downloads/macos/ からインストールしてください。"
    read -r "REPLY?Enterキーで終了します..."
    exit 1
fi

python3 start-mac.py
