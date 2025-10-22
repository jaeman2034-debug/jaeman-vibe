-- market 테이블 생성
CREATE TABLE IF NOT EXISTS market (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- blog 테이블 생성
CREATE TABLE IF NOT EXISTS blog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    author TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 샘플 데이터 (옵션)
INSERT INTO market (title, description, price, status)
VALUES ('축구공', '나이키 정품', 30000, 'open');

INSERT INTO blog (title, content, author)
VALUES ('첫 번째 글', '블로그 자동화 기능이 성공적으로 연동되었습니다!', '관리자');
