import React, {useEffect, useState} from 'react';

const PROVIDERS = {
    ollama: {
        label: 'Ollama',
        endpoint: 'http://localhost:11434',
        model: 'llama3.2',
        hint: 'Ollamaを起動して、インストール済みのモデル名を入力してください。'
    },
    lmstudio: {
        label: 'LM Studio',
        endpoint: 'http://localhost:1234',
        model: 'local-model',
        hint: 'LM StudioでLocal Serverを起動し、ロードしたモデル名を入力してください。'
    },
    webgpu: {
        label: 'WebGPU（ブラウザ内）',
        endpoint: '',
        model: 'onnx-community/Qwen2.5-0.5B-Instruct-ONNX',
        hint: '対応ブラウザでは、モデルをダウンロードしてブラウザ内だけで実行します。'
    }
};

const WEBGPU_MODELS = [
    {
        id: 'onnx-community/Qwen2.5-0.5B-Instruct-ONNX',
        label: 'Qwen2.5 0.5B（軽量・おすすめ）'
    },
    {
        id: 'onnx-community/SmolLM2-360M-Instruct-ONNX',
        label: 'SmolLM2 360M（とても軽量）'
    }
];

const DEFAULT_PROVIDER = 'ollama';
const STORAGE_KEY = 'scratch-local-ai-settings';
const fallbackAnswers = {
    blocks: '動きたいときは、青い「動き」カテゴリを見てみよう。まず「10歩動かす」を旗の下につなげて、緑の旗を押して試してみてね。',
    repeat: '同じ動きを何度もしたいときは、オレンジの「10回繰り返す」ブロックが便利だよ。その中に動きのブロックを入れてみよう。',
    stuck: 'うまく動かないときは、旗のブロックが一番上にあるか、ブロックがつながっているかを1つずつ確認してみよう。',
    default: 'いい質問だね。まずはブロックを1つだけ置いて、緑の旗で動きを確かめてみよう。小さく試すのが上達のコツだよ。'
};

let webGpuGenerator = null;
let webGpuModel = null;

const getFallback = question => {
    if (question.includes('ブロック') || question.includes('何を')) return fallbackAnswers.blocks;
    if (question.includes('くり返') || question.includes('繰り返')) return fallbackAnswers.repeat;
    if (question.includes('動かない') || question.includes('わから')) return fallbackAnswers.stuck;
    return fallbackAnswers.default;
};

const loadSettings = () => {
    try {
        const value = window.localStorage.getItem(STORAGE_KEY);
        return value ? JSON.parse(value) : {};
    } catch {
        return {};
    }
};

const storeSettings = settings => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Local storage may be disabled in a private browsing context.
    }
};

const messageText = message => message.split('\n').map((line, index, lines) => (
    <React.Fragment key={`${line}-${index}`}>
        {line}
        {index < lines.length - 1 && <br />}
    </React.Fragment>
));

const systemPrompt = 'あなたはScratchを学ぶ子供向けのやさしいメンターです。答えを一気に教えず、どのカテゴリのどのブロックをどこに置くかを短い手順で説明してください。安全で、明るい日本語を使ってください。';

const extractWebGpuAnswer = result => {
    const generated = result?.[0]?.generated_text;
    if (Array.isArray(generated)) return generated[generated.length - 1]?.content || '';
    return generated || '';
};

const LocalAiMentor = () => {
    const initial = loadSettings();
    const initialProvider = initial.provider || DEFAULT_PROVIDER;
    const [isOpen, setIsOpen] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [question, setQuestion] = useState('');
    const [provider, setProvider] = useState(initialProvider);
    const [endpoint, setEndpoint] = useState(initial[`${initialProvider}Endpoint`] || PROVIDERS[initialProvider].endpoint);
    const [model, setModel] = useState(initial[`${initialProvider}Model`] || PROVIDERS[initialProvider].model);
    const [status, setStatus] = useState('接続設定済み');
    const [isBusy, setIsBusy] = useState(false);
    const [messages, setMessages] = useState([
        {role: 'ai', text: 'こんにちは！まる先生だよ。\nScratchの使い方や、ブロックの置き方を一緒に考えるよ。'},
        {role: 'ai', text: 'わからないことがあったら、下の質問ボタンか入力欄から聞いてね。'}
    ]);

    const providerConfig = PROVIDERS[provider];
    const isWebGpu = provider === 'webgpu';

    useEffect(() => {
        if (provider === 'webgpu') return;
        setEndpoint(initial[`${provider}Endpoint`] || PROVIDERS[provider].endpoint);
        setModel(initial[`${provider}Model`] || PROVIDERS[provider].model);
    }, [provider]);

    const askRemote = async cleanQuestion => {
        const base = endpoint.replace(/\/$/, '');
        const response = await fetch(`${base}/v1/chat/completions`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                model,
                temperature: 0.5,
                messages: [
                    {role: 'system', content: systemPrompt},
                    {role: 'user', content: cleanQuestion}
                ]
            })
        });
        if (!response.ok) throw new Error('Local AI request failed');
        const result = await response.json();
        return result.choices?.[0]?.message?.content;
    };

    const askWebGpu = async cleanQuestion => {
        if (!navigator.gpu) throw new Error('WebGPU is not available');
        if (!webGpuGenerator || webGpuModel !== model) {
            setStatus('モデルを読み込み中…');
            // Loaded only when WebGPU is selected, so remote-only users do not download a model.
            const {pipeline} = await import('@huggingface/transformers');
            webGpuGenerator = await pipeline('text-generation', model, {device: 'webgpu'});
            webGpuModel = model;
        }
        const result = await webGpuGenerator([
            {role: 'system', content: systemPrompt},
            {role: 'user', content: cleanQuestion}
        ], {max_new_tokens: 160, temperature: 0.5, do_sample: true});
        return extractWebGpuAnswer(result);
    };

    const ask = async rawQuestion => {
        const cleanQuestion = rawQuestion.trim();
        if (!cleanQuestion || isBusy) return;
        setQuestion('');
        setMessages(current => [...current, {role: 'user', text: cleanQuestion}]);
        setStatus(isWebGpu ? '準備中…' : `${providerConfig.label}に接続中…`);
        setIsBusy(true);
        const fallback = getFallback(cleanQuestion);

        try {
            const answer = isWebGpu ? await askWebGpu(cleanQuestion) : await askRemote(cleanQuestion);
            setMessages(current => [...current, {role: 'ai', text: answer || fallback}]);
            setStatus(isWebGpu ? 'ブラウザ内で実行中' : `${providerConfig.label}接続中`);
        } catch (error) {
            const reason = isWebGpu ?
                'WebGPUが使えないか、モデルの読み込みに失敗したので' :
                `${providerConfig.label}に接続できなかったので`;
            setMessages(current => [...current, {role: 'ai', text: `${fallback}\n\n（${reason}、まる先生のヒントを表示しているよ）`}]);
            setStatus(isWebGpu ? 'WebGPU未使用' : 'オフラインヒント');
        } finally {
            setIsBusy(false);
        }
    };

    const selectProvider = event => {
        const nextProvider = event.target.value;
        setProvider(nextProvider);
        if (nextProvider === 'webgpu') {
            setEndpoint('');
            setModel(initial.webgpuModel || PROVIDERS.webgpu.model);
        } else {
            setEndpoint(initial[`${nextProvider}Endpoint`] || PROVIDERS[nextProvider].endpoint);
            setModel(initial[`${nextProvider}Model`] || PROVIDERS[nextProvider].model);
        }
        setStatus('接続設定済み');
    };

    const saveSettings = event => {
        event.preventDefault();
        const settings = {
            ...initial,
            provider,
            [`${provider}Endpoint`]: endpoint,
            [`${provider}Model`]: model,
            webgpuModel: provider === 'webgpu' ? model : initial.webgpuModel
        };
        storeSettings(settings);
        setShowSettings(false);
        setStatus(isWebGpu ? 'WebGPU準備完了' : '接続設定済み');
    };

    if (!isOpen) {
        return <button className="local-ai-launcher" onClick={() => setIsOpen(true)} aria-label="まる先生を開く">まる</button>;
    }

    return (
        <aside className="local-ai-mentor" aria-label="ローカルAIメンター">
            <header className="local-ai-header">
                <div className="local-ai-identity">
                    <div className="local-ai-avatar">ま</div>
                    <div>
                        <strong>まる先生</strong>
                        <span><i /> {status}</span>
                    </div>
                </div>
                <div className="local-ai-header-actions">
                    <button onClick={() => setShowSettings(current => !current)} aria-label="AI接続設定">⚙</button>
                    <button onClick={() => setIsOpen(false)} aria-label="まる先生を閉じる">×</button>
                </div>
            </header>
            {showSettings && (
                <form className="local-ai-settings" onSubmit={saveSettings}>
                    <label>接続方式
                        <select value={provider} onChange={selectProvider}>
                            <option value="ollama">Ollama（ローカル）</option>
                            <option value="lmstudio">LM Studio（ローカル）</option>
                            <option value="webgpu">WebGPU（ブラウザ内）</option>
                        </select>
                    </label>
                    {!isWebGpu && <label>API URL<input value={endpoint} onChange={event => setEndpoint(event.target.value)} placeholder={providerConfig.endpoint} /></label>}
                    {isWebGpu ? (
                        <label>WebGPUモデル
                            <select value={model} onChange={event => setModel(event.target.value)}>
                                {WEBGPU_MODELS.map(webGpuModelOption => <option key={webGpuModelOption.id} value={webGpuModelOption.id}>{webGpuModelOption.label}</option>)}
                            </select>
                        </label>
                    ) : <label>モデル名<input value={model} onChange={event => setModel(event.target.value)} placeholder={providerConfig.model} /></label>}
                    <p>{providerConfig.hint}</p>
                    {isWebGpu && <p className="local-ai-settings-note">初回だけモデルのダウンロードが必要です。Chrome / EdgeのWebGPU対応版を使ってください。</p>}
                    <button type="submit">設定を保存</button>
                </form>
            )}
            <div className="local-ai-content">
                <div className="local-ai-intro"><span>✦</span><div><strong>ひとりでできるかな？</strong><p>{providerConfig.label}でまる先生に相談できるよ。</p></div></div>
                <div className="local-ai-messages">
                    {messages.map((message, index) => (
                        <div key={`${message.role}-${index}`} className={`local-ai-message ${message.role}`}>
                            {message.role === 'ai' && <span className="local-ai-mini-avatar">ま</span>}
                            <div className="local-ai-bubble">{messageText(message.text)}</div>
                        </div>
                    ))}
                </div>
                <div className="local-ai-suggestions">
                    <span>よくある質問</span>
                    <button onClick={() => ask('どのブロックを使えばいい？')}>どのブロックを使えばいい？</button>
                    <button onClick={() => ask('くり返しってどう使うの？')}>くり返しってどう使うの？</button>
                    <button onClick={() => ask('うまく動かないときは？')}>うまく動かないときは？</button>
                </div>
            </div>
            <form className="local-ai-input" onSubmit={event => { event.preventDefault(); ask(question); }}>
                <input disabled={isBusy} value={question} onChange={event => setQuestion(event.target.value)} placeholder="まる先生に質問する…" />
                <button disabled={isBusy} type="submit" aria-label="質問を送る">↑</button>
            </form>
        </aside>
    );
};

export default LocalAiMentor;
