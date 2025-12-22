import { GoogleGenAI } from "@google/genai";

const API_KEY = "MY_API"; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const FILE_TYPES = ['Object', 'State', 'Action', 'Condition', 'Goal'];

const SYSTEM_PROMPT = `
너는 코딩 교육용 게임 데이터 생성 AI다.
사용자는 주어진 'Object', 'State', 'Action' 조각들을 조합하여 **'Goal(목표)'**을 달성하는 로직을 만든다.

[데이터 생성 규칙]
1. **Object (주체)**: 게임에 등장하는 캐릭터나 사물.
   - **중요**: Object는 반드시 **초기 State(상태)**를 하나 이상 가져야 조작이 가능하다.
2. **State (변수)**: Object가 가지는 **단 하나의 속성**.
   - 예: "위치", "기분", "체력"
3. **Action (함수)**: 상태를 변화시키는 구체적인 행동.
4. **Condition (조건)**: Action을 실행하기 위해 검사해야 하는 논리 연산식.
   - 구성: **[State] [Operator] [Value]** (예: 위치가 숲과 같다)

[JSON 포맷 요구사항]
요청된 Type에 따라 아래 포맷 중 하나를 반환하라.

**CASE 1: Type이 'Object'인 경우 (반드시 초기 State 포함)**
{
  "isBundle": true,
  "object": { "type": "Object", "name": "...", "description": "..." },
  "initialState": { "type": "State", "owner": "위_Object의_name", "name": "기본속성명", "values": ["값1", "값2"] }
}

**CASE 2: Type이 'Condition'인 경우 (구조화된 필드 필수)**
{
  "type": "Condition",
  "owner": "System", 
  "targetContent": "조건이_적용될_Action명",
  "var": "검사할_상태명(예: 위치)",
  "rel": "비교연산자_코드(예: equals, not_equals, contains)",
  "value": "비교할_값(예: 오두막)"
}

**CASE 3: 그 외 Type (State, Action, Goal)**
{
  "type": "RequestedType",
  ... (해당 타입의 필드들)
}

[필드 참고]
- State: { "type": "State", "owner": "소유자", "name": "속성", "values": [...] }
- Action: { "type": "Action", "owner": "행위자", "contentName": "...", "prev": "...", "next": "...", "constraints": {...}, "validStates": [...] }
- Goal: { "type": "Goal", "name": "...", "condition": "..." }

사용자가 요청한 Type에 맞춰 JSON을 생성하라.
`;

const SYSTEM_INSTRUCTION2 = `
Role: Game Asset Visualizer
Task: Convert a logical 'Scene Spec' JSON into a descriptive image generation prompt (English).

[Input Structure]
- entities: List of objects (name, id).
- initial_state: Key-value pairs describing the scene (e.g., "SnowWhite.location = Forest").
- actions: Logic describing what happens (e.g., "SnowWhite moves to Cottage").
- render_hint: Style suggestions.

[Output Rules]
1. **Subject**: Clearly identify the main character/object.
2. **Action/Pose**: If an action exists, depict the 'before' or 'during' moment. If only state exists, depict the static situation.
3. **Environment**: Infer the background from states like 'location' (e.g., Forest, Castle).
4. **Style**: Follow 'render_hint'. Default: "2D isometric game sprite style, cute, vibrant colors, vector art finish, white background".
5. **Format**: Return a single string of keywords and description.
`;

export const generateGameElement = async (type, userDescription) => {
  try {
    const prompt = `
      ${SYSTEM_PROMPT}
      
      사용자 요청:
      Type: ${type}
      Description: ${userDescription}
      
      위 요청에 맞는 JSON 객체를 생성하라. (Object인 경우 isBundle 포맷 사용)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', 
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text; 
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
      data = JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return { error: true, message: "JSON 파싱 실패" };
    }

    // 번들(Object + State) 처리
    if (data.isBundle && data.object && data.initialState) {
       const objId = Date.now().toString();
       const stateId = (Date.now() + 1).toString();

       return {
         isBundle: true,
         items: [
           { id: objId, ...data.object },
           { id: stateId, ...data.initialState, owner: data.object.name } // 소유권 명시 재확인
         ]
       };
    }

    // 일반 단일 처리
    return {
      isBundle: false,
      item: {
        id: Date.now().toString(),
        type: type,
        owner: data.owner || (type === 'Object' ? null : 'Unassigned'),
        ...data
      }
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { error: true, message: "API 연결 실패" };
  }
};

export const generateImagePrompt = async (sceneSpec) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `
        ${SYSTEM_INSTRUCTION2}

        [Target Scene Spec]
        ${JSON.stringify(sceneSpec, null, 2)}
      `,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Prompt Generation Failed:", error);
    throw error;
  }
};