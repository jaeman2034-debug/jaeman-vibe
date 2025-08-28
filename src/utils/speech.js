export function startSpeechRecognition(onResult) { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) {
    alert('??브라?��????�성 ?�식??지?�하지 ?�습?�다.');
    return;
} const recognition = new SR(); recognition.lang = 'ko-KR'; recognition.interimResults = false; recognition.maxAlternatives = 1; recognition.onresult = (e) => { const text = e.results?.[0]?.[0]?.transcript?.trim?.() ?? ''; if (text)
    onResult(text); }; recognition.onerror = () => { onResult(''); }; recognition.start(); }
