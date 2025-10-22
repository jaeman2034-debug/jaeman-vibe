"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataMasking = void 0;
class DataMasking {
    // 텍스트 마스킹
    static mask(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }
        let masked = text;
        for (const rule of this.rules) {
            if (typeof rule.replacement === 'function') {
                masked = masked.replace(rule.pattern, rule.replacement);
            }
            else {
                masked = masked.replace(rule.pattern, rule.replacement);
            }
        }
        return masked;
    }
    // 객체 마스킹 (재귀적)
    static maskObject(obj) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (typeof obj === 'string') {
            return this.mask(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.maskObject(item));
        }
        if (typeof obj === 'object') {
            const masked = {};
            for (const [key, value] of Object.entries(obj)) {
                // 키도 마스킹 (민감한 키 이름들)
                const maskedKey = this.maskSensitiveKey(key);
                masked[maskedKey] = this.maskObject(value);
            }
            return masked;
        }
        return obj;
    }
    // 민감한 키 이름 마스킹
    static maskSensitiveKey(key) {
        const sensitiveKeys = [
            'password', 'pwd', 'pass', 'secret', 'token', 'key', 'auth',
            'email', 'phone', 'ssn', 'card', 'credit', 'bank'
        ];
        const lowerKey = key.toLowerCase();
        for (const sensitive of sensitiveKeys) {
            if (lowerKey.includes(sensitive)) {
                return '[MASKED_KEY]';
            }
        }
        return key;
    }
    // 로그 메시지 마스킹
    static maskLogMessage(message, ...args) {
        const maskedMessage = this.mask(message);
        const maskedArgs = args.map(arg => this.maskObject(arg));
        return [maskedMessage, ...maskedArgs];
    }
    // 에러 객체 마스킹
    static maskError(error) {
        const maskedError = new Error(this.mask(error.message));
        maskedError.name = error.name;
        maskedError.stack = this.mask(error.stack || '');
        return maskedError;
    }
    // HTTP 요청/응답 마스킹
    static maskHttpRequest(request) {
        return {
            method: request.method,
            url: this.mask(request.url || ''),
            headers: this.maskObject(request.headers || {}),
            body: this.maskObject(request.body)
        };
    }
    static maskHttpResponse(response) {
        return {
            status: response.status,
            headers: this.maskObject(response.headers || {}),
            body: this.maskObject(response.body)
        };
    }
    // 사용자 정의 마스킹 규칙 추가
    static addRule(pattern, replacement, name) {
        this.rules.push({ pattern, replacement, name });
    }
    // 특정 규칙 제거
    static removeRule(name) {
        this.rules = this.rules.filter(rule => rule.name !== name);
    }
    // 모든 규칙 초기화
    static resetRules() {
        this.rules = [];
    }
    // 마스킹 통계
    static getMaskingStats(text) {
        const stats = {};
        for (const rule of this.rules) {
            const matches = text.match(rule.pattern);
            stats[rule.name] = matches ? matches.length : 0;
        }
        return stats;
    }
    // 안전한 로깅 헬퍼
    static safeLog(level, message, ...args) {
        const [maskedMessage, ...maskedArgs] = this.maskLogMessage(message, ...args);
        switch (level) {
            case 'info':
                console.log(maskedMessage, ...maskedArgs);
                break;
            case 'warn':
                console.warn(maskedMessage, ...maskedArgs);
                break;
            case 'error':
                console.error(maskedMessage, ...maskedArgs);
                break;
        }
    }
    // 민감정보 감지
    static detectSensitiveData(text) {
        const detectedTypes = [];
        for (const rule of this.rules) {
            if (rule.pattern.test(text)) {
                detectedTypes.push(rule.name);
            }
        }
        return {
            hasEmail: detectedTypes.includes('email'),
            hasPhone: detectedTypes.includes('phone_kr') || detectedTypes.includes('phone_intl'),
            hasToken: detectedTypes.includes('slack_token') || detectedTypes.includes('jwt_token') || detectedTypes.includes('api_key'),
            hasCard: detectedTypes.includes('card_number'),
            hasSSN: detectedTypes.includes('ssn_kr'),
            detectedTypes
        };
    }
    // 마스킹 품질 검사
    static validateMasking(original, masked) {
        const issues = [];
        // 원본과 마스킹된 텍스트가 같으면 문제
        if (original === masked) {
            issues.push('No masking applied');
        }
        // 여전히 민감정보가 남아있는지 확인
        const stillSensitive = this.detectSensitiveData(masked);
        if (stillSensitive.detectedTypes.length > 0) {
            issues.push(`Still contains sensitive data: ${stillSensitive.detectedTypes.join(', ')}`);
        }
        // 마스킹된 텍스트가 너무 짧으면 문제
        if (masked.length < original.length * 0.1) {
            issues.push('Masked text is too short');
        }
        return {
            isValid: issues.length === 0,
            issues
        };
    }
}
exports.DataMasking = DataMasking;
DataMasking.rules = [
    // 이메일 주소
    {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL]',
        name: 'email'
    },
    // 전화번호 (한국 형식)
    {
        pattern: /(\+82|0)?-?[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}/g,
        replacement: '[PHONE]',
        name: 'phone_kr'
    },
    // 전화번호 (국제 형식)
    {
        pattern: /(\+\d{1,3})?[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/g,
        replacement: '[PHONE]',
        name: 'phone_intl'
    },
    // API 토큰 (xoxb-, xoxp-, xoxa- 등)
    {
        pattern: /xox[bpa]-\w+/g,
        replacement: '[SLACK_TOKEN]',
        name: 'slack_token'
    },
    // JWT 토큰
    {
        pattern: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
        replacement: '[JWT_TOKEN]',
        name: 'jwt_token'
    },
    // API 키 (일반적인 패턴)
    {
        pattern: /[A-Za-z0-9]{20,}/g,
        replacement: '[API_KEY]',
        name: 'api_key'
    },
    // 신용카드 번호
    {
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        replacement: '[CARD_NUMBER]',
        name: 'card_number'
    },
    // 주민등록번호 (한국)
    {
        pattern: /\b\d{6}[-\s]?\d{7}\b/g,
        replacement: '[SSN]',
        name: 'ssn_kr'
    },
    // IP 주소
    {
        pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        replacement: '[IP_ADDRESS]',
        name: 'ip_address'
    },
    // URL의 쿼리 파라미터 (token, key, secret 등)
    {
        pattern: /[?&](token|key|secret|password|pwd|pass)=[^&\s]+/gi,
        replacement: (match) => {
            const param = match.split('=')[0];
            return `${param}=[MASKED]`;
        },
        name: 'url_params'
    },
    // Firebase 토큰
    {
        pattern: /[A-Za-z0-9_-]{100,}/g,
        replacement: '[FIREBASE_TOKEN]',
        name: 'firebase_token'
    }
];
exports.default = {
    DataMasking
};
