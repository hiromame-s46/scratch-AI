# Macでのセットアップ

## 初回だけ

1. [Node.js公式サイト](https://nodejs.org/en/download/)から`v24.19.0 LTS`をインストール
2. ターミナルでプロジェクトフォルダを開く
3. 依存関係をインストールする

```bash
cd /path/to/scratch-AI
npm ci

npm --workspace @scratch/task-herder run build
npm --workspace @scratch/scratch-storage run build
npm --workspace @scratch/scratch-svg-renderer run build
npm --workspace @scratch/scratch-render run build
npm --workspace @scratch/scratch-vm run build
npm --workspace @scratch/scratch-gui run build
```

## 起動

Finderで`start-mac.command`をダブルクリックしてください。

ブラウザが自動で開き、Scratch AIが起動します。

初回に「開発元を確認できない」と表示された場合は、`start-mac.command`を右クリックして「開く」を選択してください。
