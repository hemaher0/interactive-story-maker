# Interactive Story Maker

### 이야기를 구성하고, 규칙을 연결하고, 장면을 그림으로 확인하는 창작·코딩 도구

Interactive Story Maker는 어린이가 등장인물과 사건을 만들면서 **상태, 조건, 행동, 결과의 관계**를 표현하도록 설계한 웹 도구입니다. 인물의 특징은 문장으로 입력하고, 누가 무엇을 하며 그 뒤에 무엇이 바뀌어야 하는지는 블록에서 구성합니다. 만들어진 이야기의 맥락은 AI가 생성한 장면 이미지로 확인할 수 있습니다.

**GIST Intelligent Agent 수업 기말 프로젝트 · 개인 프로젝트**  
React · JavaScript · SVG · Gemini API

## 목차

- [주요 기능과 사용 흐름](#주요-기능과-사용-흐름)
- [이야기를 표현하는 데이터 모델](#이야기를-표현하는-데이터-모델)
- [시스템 구조](#시스템-구조)
- [기술 선택과 구현](#기술-선택과-구현)
- [구현 내용](#구현-내용)
- [개발 환경과 실행](#개발-환경과-실행)
- [코드 구조](#코드-구조)

## 주요 기능과 사용 흐름

화면은 **Scene**, **Assets**, **Block Canvas**의 세 영역으로 구성됩니다. Scene에서 그림을 보고, Assets에서 이야기 요소를 관리하며, Block Canvas에서 요소 사이의 관계를 연결합니다.

<table>
  <tr>
    <th width="33%">1. 장면과 규칙 구성</th>
    <th width="33%">2. 추가할 요소 입력</th>
    <th width="33%">3. 블록과 장면 확인</th>
  </tr>
  <tr>
    <td><a href="assets/img/01-scene-rules.png"><img src="assets/img/01-scene-rules.png" alt="백설공주와 곰의 상태 및 선물하기 규칙을 연결한 화면" width="100%"></a></td>
    <td><a href="assets/img/02-natural-language-input.png"><img src="assets/img/02-natural-language-input.png" alt="공주와 곰에게 다가오는 토끼를 문장으로 입력하는 화면" width="100%"></a></td>
    <td><a href="assets/img/03-rabbit-scene.png"><img src="assets/img/03-rabbit-scene.png" alt="토끼의 상태와 접근 규칙, 토끼가 포함된 장면을 확인하는 화면" width="100%"></a></td>
  </tr>
  <tr>
    <td>인물·상태·행동의 관계 연결</td>
    <td>새 인물과 행동을 문장으로 설명</td>
    <td>추가된 규칙과 시각화된 장면 확인</td>
  </tr>
</table>

세 화면은 자연어 입력부터 블록 구성과 장면 확인까지의 흐름을 보여주는 UI 목업입니다. 이미지를 누르면 원본 크기로 볼 수 있습니다.

### 1. 인물과 행동의 관계를 블록으로 구성

첫 화면은 백설공주가 곰에게 사과를 선물하는 장면입니다. 백설공주의 `사과 소지`, 곰의 `관계`를 상태로 두고, `선물하기`에 행동의 주체와 대상을 지정합니다. 조건에는 사과를 가지고 있는지, 결과에는 사과 소지와 곰의 관계를 어떻게 바꿀지를 작성합니다.

- Assets에서 Object·State·Action·Condition 등의 요소를 찾아 캔버스로 끌어 놓습니다.
- 인물과 상태의 소유 관계, 행동의 주체·대상, 행동에 필요한 조건을 포트로 연결합니다.
- 블록의 위치를 바꾸거나 캔버스를 이동하면서 관계를 살펴보고, 편집창에서 속성과 행동 규칙을 수정합니다.

### 2. 문장으로 이야기 요소를 추가

인물이나 사물의 특징을 문장으로 설명해 이야기 요소의 초안을 만들 수 있습니다. 생성 창에서 Object·State·Action·Condition·Goal 중 타입을 선택하고 설명을 입력합니다. Object를 요청하면 해당 Object와 초기 State를 묶어 받아 Assets에 추가합니다.

토끼를 추가하는 화면 예시는 공주와 곰에게 호기심을 느끼며 다가오는 상황을 인물·상태·행동·조건으로 나누어 보여줍니다.

### 3. 추가된 규칙과 장면을 함께 확인

마지막 화면에는 토끼의 `기분`과 `위치`, `공주와 곰에게 다가가기` 행동이 배치됩니다. `기분 = 호기심`을 조건으로 두고, 결과에는 토끼의 위치를 공주와 곰 곁으로 바꾸는 규칙을 표현합니다. 왼쪽 Scene에서는 토끼가 포함된 그림을 함께 볼 수 있습니다.

장면 시각화는 **Visualize Scene** 버튼으로 요청합니다. 현재 캔버스의 내용을 장면 명세로 정리하고, 이를 이미지 생성과 연결합니다. 규칙을 수정한 뒤 다시 요청하면 그때 구성한 내용을 새로운 이미지 요청에 사용할 수 있습니다.

## 이야기를 표현하는 데이터 모델

등장인물과 행동을 구분하고, 사용자가 조건과 결과를 덧붙일 수 있도록 이야기 요소를 나눴습니다. “곰에게 사과를 준다”는 행동에 “사과를 가지고 있어야 한다”는 조건과 “곰과 친구가 된다”는 결과를 추가하는 방식입니다.

| 요소 | 표현하는 내용 | 선물하기 장면의 예 |
| --- | --- | --- |
| **Object** | 인물·사물·장소. 자신의 상태를 참조 | 백설공주, 곰, 사과, 깊은 숲 |
| **State** | 속성의 정의와 가능한 값. 대상에 연결된 현재 값 | 사과 소지: true/false, 관계: 경계함/친구 |
| **Action** | 주체(Actor)와 대상(Target), 조건과 결과를 가진 행동 | 백설공주가 곰에게 선물하기 |
| **Condition** | 상태나 값을 비교하는 식 | 백설공주의 사과 소지 = true |
| **Effect** | 행동의 결과로 의도한 상태 대입 | 사과 소지 = false, 곰의 관계 = 친구 |
| **Goal** | 이야기의 목표 조건과 엔딩 설명 | 곰과 친구되기 |

State의 값은 문자열만으로 다루지 않고, Boolean·리터럴·Object 참조 등을 구분합니다. 예를 들어 `사과 소지`는 Boolean 값이고, `위치`는 장소 Object를 가리킬 수 있습니다. Condition은 상태와 상수를 비교하거나 서로 다른 대상의 상태를 비교하도록 표현합니다.

### 예시: 선물하기 규칙

백설공주와 곰에 위치 상태를 지정하고, 기본 데이터의 `선물하기`에 백설공주를 Actor, 곰을 Target으로 연결한 예시입니다.

| 구분 | 규칙 |
| --- | --- |
| 주체와 대상 | Actor = 백설공주, Target = 곰 |
| 조건 1 | Actor와 Target의 위치가 같다 |
| 조건 2 | Actor의 사과 소지가 true다 |
| 결과 1 | Actor의 사과 소지를 false로 설정 |
| 결과 2 | Target의 관계를 친구로 설정 |

여기서 Condition은 **어떤 상태를 검사할지**, Effect는 **어떤 상태를 어떤 값으로 바꿀지**를 담습니다. Effect는 Action 내부에 저장하는 상태 대입 규칙입니다. Condition을 행동에 연결하고, Action 편집창에서 조건과 결과를 확인·수정하는 방식으로 다룹니다.

관련 코드: [기본 이야기 데이터](src/data/initialData.js), [요소 편집창](src/components/ComponentEditor.js)

## 시스템 구조

![입력, 이야기 요소 생성, 블록 편집, 장면 명세, 이미지 생성의 처리 구조](assets/img/story-pipeline.svg)

앱은 React 클라이언트와 Gemini API 호출로 구성됩니다. 이야기 요소를 만드는 경로와, 편집한 내용을 이미지로 만드는 경로를 나누어 연결했습니다. 기본 예시 데이터는 앱에 포함돼 있어, 요소 생성 요청 없이도 Assets에서 블록을 가져와 규칙을 구성할 수 있습니다.

### 이야기 요소 생성 경로

1. 생성 창에서 **요소 타입과 설명**을 입력합니다.
2. `generateGameElement()`가 타입별 JSON 형식을 포함한 요청을 Gemini에 전달합니다.
3. 응답을 파싱하고, 단일 요소 또는 Object·초기 State 묶음으로 처리합니다.
4. 결과를 Assets에 추가합니다. 사용자는 필요한 요소를 캔버스로 끌어 놓고 편집합니다.

### 장면 시각화 경로

1. `exportCanvasSnapshot()`이 현재 블록과 연결 정보를 snapshot으로 만듭니다.
2. `buildSceneSpec()`이 snapshot에서 인물, 상태, 행동 정보를 추려 장면 명세를 구성합니다.
3. `generateImagePrompt()`가 장면 명세를 이미지에 필요한 인물·동작·배경 묘사로 바꿉니다.
4. `generateSceneImage()`가 프롬프트로 이미지를 요청합니다.
5. 응답의 이미지 데이터를 Data URL로 변환해 Scene 패널에 표시합니다.

SceneSpec에는 `entities`, `initial_state`, `actions`, `render_hint`를 담습니다. 화면 배치 좌표나 연결선 자체보다 **누가 등장하고, 어떤 상태이며, 어떤 행동을 정의했는지**를 이미지 요청에 전달하는 단계입니다. `initial_state`에는 Object의 상태를 나타내는 State 블록(slot 모드) 중 소유자가 지정된 블록의 현재 값을 정리합니다. 조건과 결과는 Action에 저장된 내용을 사용합니다.

관련 코드: [snapshot 변환](src/api/exportCanvasSnapshot.js), [SceneSpec 구성](src/api/sceneSpec.js), [시각화 요청 연결](src/components/BlockCanvas.js)

## 기술 선택과 구현

### 1. 자연어 입력을 편집 가능한 초안으로: Gemini와 JSON 응답

이야기의 인물과 사물을 자유롭게 설명하면서도, 편집기에서는 이름·속성·소유 관계처럼 정해진 필드를 다룰 수 있어야 했습니다. 이를 위해 **자연어 설명을 타입별 JSON 초안으로 받는 방식**을 사용했습니다.

요청에는 선택한 타입과 필요한 필드 형식을 포함하고, Gemini의 응답 MIME 타입을 `application/json`으로 지정합니다. Object에는 초기 상태가 하나 이상 포함되도록 요청합니다. 반환된 묶음은 Object와 State로 나누어 각각 식별자를 붙인 뒤 Assets에 추가합니다. 다른 타입은 단일 요소로 처리합니다.

생성 결과는 **사용자가 수정할 데이터의 초안**으로 다룹니다. `FileGenerator`가 요청·로딩·오류 표시와 결과 추가를 맡고, 이후의 확인과 수정은 편집 화면에서 이루어집니다. 응답 파싱 실패와 API 연결 실패도 구분해 반환합니다.

관련 코드: [타입별 프롬프트와 JSON 처리](src/api/llmApi.js), [생성 창과 결과 처리](src/components/FileGenerator.js)

### 2. 연결의 의미가 드러나는 편집기: React, SVG, 타입별 포트

인물과 상태를 연결하는 것과 인물을 행동에 연결하는 것은 의미가 다릅니다. 전자는 상태의 소유자를 정하고, 후자는 행동의 Actor 또는 Target을 정합니다. 이 차이를 화면에서 다루기 위해 Object·State·Action·Condition별 블록과 포트를 직접 구성했습니다.

React에서는 캔버스의 블록과 연결 목록을 상태로 관리합니다. 블록 카드에는 타입에 필요한 입력과 연결 지점을 표시하고, SVG 선은 블록 사이의 관계를 보여줍니다. 블록 이동과 캔버스 패닝도 이 좌표·상태를 바탕으로 처리합니다.

연결 요청은 `isAllowedConnection()`에서 출발·도착 블록과 포트의 조합을 검사합니다. 다음 네 가지 연결에서는 관계에 맞는 데이터를 갱신합니다.

- **Object → State:** State의 소유자 지정
- **Object → Action:** Actor 또는 Target 참조 지정
- **Object의 State → Condition:** 비교할 대상과 속성 지정
- **Condition → Action:** 연결할 때 조건식의 내용을 행동의 조건 목록에 추가

Condition → Action 연결은 연결 시점의 조건식을 Action에 복사하는 방식입니다. 이후 행동에 적용할 조건은 Action 편집창에서 확인하고 수정합니다.

`actor`와 `target`은 조건·결과에서 각각 Action의 주체와 대상을 가리키는 역할 참조입니다.

관련 코드: [연결 가능 조합](src/components/blocks/blockGraph.js), [연결에 따른 데이터 갱신](src/components/BlockCanvas.js), [타입별 블록 내용](src/components/blocks/BlockContents.js)

### 3. 편집한 규칙의 맥락을 이미지로: SceneSpec과 두 단계 생성

캔버스에는 위치·식별자·포트와 같은 편집 정보와, 인물·상태·행동처럼 이야기의 내용이 함께 존재합니다. 이미지 요청에서는 이야기의 내용을 전달할 수 있도록 중간 표현인 **SceneSpec**을 두었습니다.

[시각화 경로](#장면-시각화-경로)에서 snapshot을 SceneSpec으로 변환하면서 Object·State 식별자를 이름으로 풀고, 행동의 조건과 결과를 문자열로 정리합니다.

| 편집 데이터 | 장면 명세에서의 표현 |
| --- | --- |
| Object의 식별자 | 등장인물의 이름과 ID |
| 소유자가 지정된 State와 현재 값 | `백설공주.사과 소지`, `true` |
| Action의 Actor·Target 참조 | `백설공주`, `곰` |
| Effect의 상태 참조와 대입 값 | `actor.사과 소지 set false` |

이 장면 명세를 바탕으로 텍스트 모델이 인물의 모습·동작·환경을 담은 이미지 프롬프트를 만들고, 이미지 모델이 장면을 생성합니다. 편집 데이터 정리, 시각적 묘사 생성, 이미지 생성을 나누어 연결한 구조입니다. 사용자가 규칙을 바꾸면 현재 캔버스를 다시 읽어 같은 과정을 요청합니다.

이미지 생성 중에는 중복 요청을 막고, 응답 이미지를 Scene에 반영합니다. 요청에 실패하면 오류를 표시하고 로딩 상태를 해제합니다.

관련 코드: [SceneSpec](src/api/sceneSpec.js), [이미지 프롬프트](src/api/llmApi.js), [이미지 응답 처리](src/api/nanobanana.js), [Scene 표시](src/components/Scene.js)

## 구현 내용

- 이야기 요소의 생성·조회, Object·State·Action·Goal 편집과 Assets에서 캔버스로 가져오는 흐름
- 타입별 블록 배치·이동·삭제, 포트 연결, 상태 및 행동 규칙 편집
- 현재 캔버스를 SceneSpec으로 정리해 이미지 생성을 요청하고 Scene에 표시하는 흐름
- 기본 이야기 예시와 생성·시각화 요청의 로딩 및 오류 처리

## 개발 환경과 실행

### 사용 기술

| 구분 | 기술 | 사용 위치 |
| --- | --- | --- |
| UI | React 19, JavaScript, CSS | Assets, 생성·편집창, 블록 캔버스, Scene |
| 관계 표시 | SVG | 블록 사이의 연결선 |
| AI 연동 | `@google/genai` | 이야기 요소·프롬프트·이미지 생성 요청 |
| 텍스트 생성 | `gemini-2.0-flash` | JSON 요소 생성, 이미지 프롬프트 생성 |
| 이미지 생성 | `gemini-2.5-flash-image` | 장면 이미지 생성 |
| 개발·빌드 | Create React App, `react-scripts` | 개발 서버, 빌드, 테스트 스크립트 |

### 로컬 실행

Node.js와 npm을 설치한 뒤 다음 명령으로 개발 서버를 실행합니다.

```bash
git clone https://github.com/hemaher0/interactive-story-maker.git
cd interactive-story-maker
npm ci
npm start
```

개발 서버가 시작되면 [http://localhost:3000](http://localhost:3000)에서 확인합니다. 처음에는 기본 예시가 Assets에 표시됩니다.

1. Assets에서 필요한 인물·상태·행동을 캔버스로 끌어 놓습니다.
2. 인물의 상태와 Action의 Actor·Target을 지정하고, 조건과 결과를 편집합니다.
3. 요소를 더 만들려면 Assets의 `+`를 눌러 타입과 설명을 입력합니다.
4. 그림을 요청하려면 **Visualize Scene**을 누릅니다.

### API 설정

AI 요소·이미지 생성에는 Gemini API 키와 위 모델에 대한 접근 권한이 필요합니다. 로컬에서 생성 기능을 실험할 때는 `src/api/llmApi.js`와 `src/api/nanobanana.js`의 `MY_API` 자리에 키를 설정합니다.

브라우저에서 Gemini SDK를 직접 호출하는 구조이므로, 키를 설정한 소스는 로컬에서 관리합니다. 공개 배포 시에는 키가 클라이언트에 노출되지 않도록 API 호출과 키 관리를 서버에서 처리해야 합니다.

### 스크립트

| 명령 | 용도 |
| --- | --- |
| `npm start` | 개발 서버 실행 |
| `npm run build` | `build/`에 배포용 정적 파일 생성 |

## 코드 구조

```text
src/
├── App.js                         # Assets·Scene 상태와 전체 화면 구성
├── data/initialData.js             # 예시 Object·State·Action·Condition·Goal
├── components/
│   ├── Hierarchy.js               # Assets 목록, 생성·편집 진입점
│   ├── FileGenerator.js           # 타입과 설명 입력, AI 생성 결과 처리
│   ├── ComponentEditor.js         # 요소 속성 및 Action 조건·결과 편집
│   ├── BlockCanvas.js             # 블록 배치·연결·시각화 요청
│   ├── blocks/                    # 블록 카드, 포트, 연결 규칙, 값 표현
│   ├── hooks/useBlockDragger.js    # 블록 이동
│   └── Scene.js                   # 생성한 장면 이미지 표시
└── api/
    ├── llmApi.js                  # 이야기 요소·이미지 프롬프트 생성
    ├── exportCanvasSnapshot.js    # 캔버스 snapshot 생성
    ├── sceneSpec.js               # 이야기 내용을 장면 명세로 요약
    └── nanobanana.js              # 장면 이미지 요청 및 응답 처리
```
