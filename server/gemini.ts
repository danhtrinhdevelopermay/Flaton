import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateVBACode(prompt: string, documentType: 'word' | 'excel' | 'powerpoint'): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const documentTypeMap = {
    word: 'Microsoft Word',
    excel: 'Microsoft Excel', 
    powerpoint: 'Microsoft PowerPoint'
  };

  const systemPrompt = `Bạn là chuyên gia VBA (Visual Basic for Applications). Nhiệm vụ của bạn là viết mã VBA macro cho ${documentTypeMap[documentType]}.

QUAN TRỌNG:
- Chỉ trả về mã VBA thuần túy, không giải thích
- Mã phải hoàn chỉnh và có thể chạy được
- Sử dụng tiếng Việt cho các comment và text trong code
- Code phải tương thích với ${documentTypeMap[documentType]}
- Bao gồm Sub Main() hoặc tên Sub phù hợp

Yêu cầu của người dùng: ${prompt}`;

  const result = await model.generateContent(systemPrompt);
  const response = await result.response;
  let text = response.text();
  
  text = text.replace(/```vba?\n?/gi, '').replace(/```\n?/g, '').trim();
  
  return text;
}

export async function chatWithAI(messages: { role: string; content: string }[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemPrompt = `Bạn là trợ lý AI chuyên về VBA và Microsoft Office. Bạn giúp người dùng:
- Viết mã VBA cho Word, Excel, PowerPoint
- Giải thích cách sử dụng VBA
- Tối ưu hóa mã VBA
- Sửa lỗi trong mã VBA

Trả lời bằng tiếng Việt.`;

  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  formattedMessages.unshift({
    role: 'user',
    parts: [{ text: systemPrompt }]
  });
  
  formattedMessages.splice(1, 0, {
    role: 'model',
    parts: [{ text: 'Tôi đã hiểu. Tôi sẵn sàng hỗ trợ bạn về VBA và Microsoft Office.' }]
  });

  const chat = model.startChat({
    history: formattedMessages.slice(0, -1),
  });

  const lastMessage = formattedMessages[formattedMessages.length - 1];
  const result = await chat.sendMessage(lastMessage.parts[0].text);
  const response = await result.response;
  
  return response.text();
}

export function extractVBAFromResponse(text: string): string | null {
  const codeBlockMatch = text.match(/```(?:vba|vb)?\n?([\s\S]*?)```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  const subMatch = text.match(/(Sub\s+\w+[\s\S]*?End\s+Sub)/i);
  if (subMatch) {
    return subMatch[0].trim();
  }
  
  return null;
}
