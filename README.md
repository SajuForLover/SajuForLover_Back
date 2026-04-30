# 애인사주오! (SajuForLover) Backend API

AI(Google GenAI) 모델을 활용하여 사용자의 사주와 관상을 분석하는 백엔드 서버입니다. NestJS 프레임워크와 TypeORM을 기반으로 구현되었습니다.

## 사전 준비 (Prerequisites)

- Node.js (v18 이상 권장)
- npm
- Google Gemini API Key
- 데이터베이스 (MySQL)

## 설치 방법 (Installation)

```bash
npm install
```

## 환경 변수 설정 (.env)

프로젝트 루트 디렉토리(`./`)에 `.env` 파일을 생성하고 아래와 같이 환경변수를 설정합니다.

```env
# Google AI API Key (필수: 사주용 gemma 모델 및 관상 비전 모델 호출에 사용)
GEMINI_API_KEY=your_google_api_key_here

# Database Configuration (사용 중인 데이터베이스 환경에 맞게 수정)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=sajuforlover_db
```

## 프로젝트 실행 (Running the app)

```bash
# development
npm run start

# watch mode (코드 변경 시 자동 재시작 - 개발 시 권장)
npm run start:dev

# production mode
npm run start:prod
```

## API 문서 (Swagger UI)

서버 실행 후, 아래 URL로 접속하여 Swagger UI를 통해 API 명세서를 확인하고 테스트할 수 있습니다.

- **Swagger URL:** `http://localhost:3000/api` (포트 번호는 환경에 따라 다를 수 있습니다)

## 주요 기능

- **사주 분석 (`/saju`)**: 사용자의 이름, 성별, 생년월일시, 달력 종류 등을 입력받아 Google GenAI(`gemma-3-12b-it` 등) 모델이 사주 데이터를 분석하여 결과를 반환합니다.
- **관상 분석 (`/physiognomy`)**: 사용자의 식별자(UUID)와 인물 사진 이미지(JPG/PNG)를 입력받아 Google GenAI(`gemini-3.1-flash-lite-preview`) 비전 모델로 관상, 재물운, 연애운 등을 분석합니다.
- **유저 식별 (`/user`)**: UUID를 기반으로 사용자를 분석 정보(사주, 관상 등)와 매핑합니다.
