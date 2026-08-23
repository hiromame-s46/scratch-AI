import React, {useState} from 'react';

const DEFAULT_ENDPOINT = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';

const fallbackAnswers = {
    blocks: '動きたいときは、青い「動き」カテゴリを見てみよう。まず「10歩動かす」を旗の下につなげて、緑の旗を押して試してみてね。',
    repeat: '同じ動きを何度もしたいときは、オレンジの「10回繰り返す」ブロックが便利だよ。その中に動きのブロックを入れてみよう。',
    stuck: 'うまく動かないときは、旗のブロックが一番上にあるか、ブロックがつながっているかを1つずつ確認してみよう。',
    default: 'いい質問だね。まずはブロックを1つだけ置いて、緑の旗で動きを確かめてみよう。小さく試すのが上達のコツだよ。'
};

const getFallback = question => {
    if (question.includes('ブロック') || question.includes('何を')) return fallbackAnswers.blocks;
    if (question.includes('くり返') || question.includes('繰り返')) return fallbackAnswers.repeat;
    if (question.includes('動かない') || question.includes('わから')) return fallbackAnswers.stuck;
    return fallbackAnswers.default;
};

const saved = key => {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

const store = (key, value) => {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Local storage may be disabled in a private browsing context.
    }
};

const messageText = message => message.split('\n').map((line, index) => (
    <React.Fragment key={`${line}-${index}`}>
        {line}
        {index < message.split('\n').length - 1 && <br />}
    </React.Fragment>
));

const LocalAiMentor = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [question, setQuestion] = useState('');
    const [endpoint, setEndpoint] = useState(saved('scratch-local-ai-endpoint') || DEFAULT_ENDPOINT);
    const [model, setModel] = useState(saved('scratch-local-ai-model') || DEFAULT_MODEL);
    const [status, setStatus] = useState('接続設定済み');
    const [messages, setMessages] = useState([
        {role: 'ai', text: 'こんにちは！まる先生だよ。\nScratchの使い方や、ブロックの置き方を一緒に考えるよ。'},
        {role: 'ai', text: 'わからないことがあったら、下の質問ボタンか入力欄から聞いてね。'}
    ]);

    const ask = async rawQuestion => {
        const cleanQuestion = rawQuestion.trim();
        if (!cleanQuestion) return;
        setQuestion('');
        setMessages(current => [...current, {role: 'user', text: cleanQuestion}]);
        setStatus('考え中…');
        const fallback = getFallback(cleanQuestion);

        try {
            const base = endpoint.replace(/\/$/, '');
            const response = await fetch(`${base}/v1/chat/completions`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    model,
                    temperature: 0.5,
                    messages: [
                        {
                            role: 'system',
                            content: 'あなたはScratchを学ぶ子供向けのやさしいメンターです。答えを一気に教えず、どのカテゴリのどのブロックをどこに置くかを短い手順で説明してください。安全で、明るい日本語を使ってください。'
                        },
                        {role: 'user', content: cleanQuestion}
                    ]
                })
            });
            if (!response.ok) throw new Error('Local AI request failed');
            const result = await response.json();
            const answer = result.choices?.[0]?.message?.content || fallback;
            setMessages(current => [...current, {role: 'ai', text: answer}]);
            setStatus('接続中');
        } catch {
            setMessages(current => [...current, {role: 'ai', text: `${fallback}\n\n（ローカルAIに接続できなかったので、まる先生のヒントを表示しているよ）`}]);
            setStatus('オフラインヒント');
        }
    };

    const saveSettings = event => {
        event.preventDefault();
        store('scratch-local-ai-endpoint', endpoint);
        store('scratch-local-ai-model', model);
        setShowSettings(false);
        setStatus('接続設定済み');
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
                    <label>ローカルAIのURL<input value={endpoint} onChange={event => setEndpoint(event.target.value)} /></label>
                    <label>モデル名<input value={model} onChange={event => setModel(event.target.value)} /></label>
                    <p>Ollama: localhost:11434 / LM Studio: localhost:1234</p>
                    <button type="submit">設定を保存</button>
                </form>
            )}
            <div className="local-ai-content">
                <div className="local-ai-intro"><span>✦</span><div><strong>ひとりでできるかな？</strong><p>つまずいたら、いつでも聞いてね。</p></div></div>
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
                <input value={question} onChange={event => setQuestion(event.target.value)} placeholder="まる先生に質問する…" />
                <button type="submit" aria-label="質問を送る">↑</button>
            </form>
        </aside>
    );
};

export default LocalAiMentor;
