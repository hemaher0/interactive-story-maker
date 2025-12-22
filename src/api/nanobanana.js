import { GoogleGenAI } from "@google/genai";
// 실제 서비스의 엔드포인트로 교체 필요
const API_KEY = "MY_API"; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateSceneImage = async (prompt) => {
  try {
    console.log(">> Nano Banana 모델 호출 중: ", prompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || "image/png";
        
        // 브라우저 <img> 태그에서 즉시 사용 가능한 Data URL 반환
        return `data:${mimeType};base64,${base64Data}`;
      }
    }
    throw new Error("응답 데이터에 이미지 파트(inlineData)가 없습니다.");

  } catch (error) {
    console.error("Nano Banana Generation Error:", error);
    
    throw new Error(`Nano Banana 연동 실패: ${error.message}`);
  }
};