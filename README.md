# ReturnLink (리턴링크)

인스타그램 1인 마켓 사장님을 위한 교환·반품 접수·관리 서비스입니다.

## 주소 구조

| 주소 | 화면 |
| --- | --- |
| `/` | 소개 페이지 |
| `/start` | 카카오 가입 → 처음 설정 3단계 → 내 링크 발급 |
| `/admin` | 사장님 화면 (로그인 필요) |
| `/@마켓주소` | 손님 접수 화면 (로그인 없이 누구나) |

## 처음 한 번만 하는 설정

### 1. Supabase
1. supabase.com 에서 새 프로젝트를 만들어요. (지역은 Seoul 추천)
2. 왼쪽 **SQL Editor** → New query → `supabase/schema.sql` 내용을 전부 붙여 넣고 **Run**.
3. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키를 복사해 둬요.
   (화면에 publishable 키만 보이면 그 키를 써도 돼요.)

### 2. 카카오 로그인
1. developers.kakao.com → 내 애플리케이션 → 앱 추가.
2. **카카오 로그인** 활성화 ON.
3. Redirect URI 에 `https://<Supabase 프로젝트 주소>.supabase.co/auth/v1/callback` 등록.
4. 동의항목에서 닉네임을 켜요.
5. 앱 키의 **REST API 키**, 보안 메뉴의 **Client Secret**(생성 후 활성화)을 복사해요.
6. Supabase → **Authentication → Sign In / Providers → Kakao** 를 켜고
   Client ID 에 REST API 키, Client Secret 을 넣어요.
   이메일 없이 가입을 허용하는 옵션이 있으면 켜 주세요. (없으면 카카오 동의항목에서 이메일도 받게 해요.)
7. Supabase → **Authentication → URL Configuration**
   - Site URL: `https://내-vercel-주소`
   - Redirect URLs: `https://내-vercel-주소/**` 추가

### 3. Vercel
1. 이 폴더 전체를 GitHub 저장소에 올려요. (예전 `app/m` 폴더가 있으면 지워요.)
2. Vercel → 프로젝트 → **Settings → Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon 키
3. **Deployments → Redeploy**.

### 4. 확인
1. 내 Vercel 주소로 들어가서 가입 → 처음 설정을 끝내요.
2. 휴대폰에서 `내주소/@마켓주소` 로 들어가 접수를 하나 넣어요.
3. 사장님 화면에 바로 뜨면 성공이에요.

## 나중에 켜는 기능

- **택배 실시간 조회**: 스마트택배 API 키를 받은 뒤 환경변수
  `NEXT_PUBLIC_TRACKING=on`, `SWEETTRACKER_API_KEY=키` 를 넣고 다시 배포하면 손님 화면에 조회 칸이 나와요.
- **결제·카톡 알림톡**: 사업자등록 후 연결 예정. 지금은 모두 무료예요.

## 안전장치

- 사장님은 자기 마켓 접수만 볼 수 있어요. (DB 행 수준 보안)
- 손님 접수는 서버 함수로만 들어가고, 배송비·처리 상태는 서버가 다시 계산해서 손님이 조작할 수 없어요.
- 손님 진행 조회에는 연락처·주소·메모가 빠진 정보만 보내요.
- 처리가 끝난 지 90일 지난 접수는 사장님 화면을 열 때 자동으로 지워져요.
- 사장님이 설정에서 탈퇴하면 마켓·접수·로그인 계정이 모두 지워져요.

## 운영실 (/ops)

- 주소: `https://returnlinks.com/ops` (운영자 카카오 계정으로 로그인)
- 처음 한 번 Supabase SQL Editor 에서 `supabase/ops.sql` 을 실행하세요.
  가장 먼저 가입한 마켓의 주인이 운영자로 자동 등록돼요.
- 보이는 것: 실시간 접속자, 가입 사장님 수, 오늘·14일 방문, 7일 접수, 유료 사장님·월 예상 매출,
  사장님별 요금제·다음 결제일(D-day)·접수·손님 방문·마지막 로그인
- 요금제와 결제일은 사장님 줄의 요금제 버튼을 눌러 직접 바꿔요 (자동 결제는 아직 없어요)

## CS 센터 (주문 조회 + 1:1 문의)

1. Supabase → SQL Editor 에서 `supabase/cs.sql` 을 한 번 실행하세요. (예전에 실행했어도 다시 실행하면 새 칸이 추가돼요)
2. 사장님 화면 → **주문·발송** 에서 주문 엑셀(.xlsx, .csv)을 올려요.
3. 주문을 체크해서 **입금 확인**, **발송 예정일**을 한 번에 정해요. 맨 위 **발송 안내** 문구도 적어 두세요.
4. 택배를 보낸 뒤 송장 엑셀을 올리면 같은 사람에게 송장이 알아서 붙어요.
5. 손님은 내 링크의 **주문 조회**에서 이름 + 전화번호 뒤 4자리로 `주문 확인 → 입금 확인 → 발송 준비 → 송장 나옴` 단계를 봐요.
6. 손님이 **1:1 문의**를 남기면 사장님 화면에 바로 뜨고, 답변을 적으면 손님이 링크에서 확인해요.
7. 주문·문의 기록은 90일이 지나면 자동으로 지워져요.
