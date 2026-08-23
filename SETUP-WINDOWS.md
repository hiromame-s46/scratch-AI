# Windowsでのセットアップ

## 1. Node.jsをインストール

[Node.js公式ダウンロードページ](https://nodejs.org/en/download/)から、`v24.19.0 LTS`の`Windows Installer (.msi) x64`をダウンロードしてインストールします。

インストール後、コマンドプロンプトで次を実行して確認します。

```cmd
node -v
npm -v
```

`node -v`が`v24`で始まっていれば準備完了です。

## 2. プロジェクトをダウンロード

GitHubの「Code」→「Download ZIP」からダウンロードし、ZIPを展開します。

## 3. セットアップ

展開した`scratch-AI`フォルダの中にある`setup-windows.cmd`をダブルクリックします。

このファイルが次の処理を自動で行います。

- npmパッケージのインストール
- Scratchの関連パッケージのビルド
- Scratch AIエディターのビルド

初回は数分かかることがあります。

## 4. 起動

セットアップ完了後、`start-windows.cmd`をダブルクリックします。

ブラウザで次のURLを開きます。

```text
http://localhost:5173/
```

## AIの接続

画面右上の「まる先生」の歯車ボタンから選択できます。

- Ollama：WindowsにOllamaを別途インストール
- LM Studio：WindowsにLM Studioを別途インストールし、Local Serverを起動
- WebGPU：対応ブラウザでモデルを初回ダウンロード

セットアップや起動で困ったときは、黒い画面に表示されたエラーを保存して確認してください。
