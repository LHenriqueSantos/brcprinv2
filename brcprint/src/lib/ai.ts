import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getAiResponse(messages: any[], context: string) {
  if (!process.env.OPENAI_API_KEY) {
    return "Desculpe, a chave da API da OpenAI não está configurada. Por favor, contate o administrador.";
  }

  const systemMessage = {
    role: "system",
    content: `Você é o Assistente Virtual da BRCPrint, uma empresa de impressão 3D premium.
Seu objetivo é ser prestativo, educado e técnico quando necessário.

DIRETRIZES:
1. Responda em Português do Brasil.
2. Use o contexto fornecido abaixo para responder perguntas específicas sobre pedidos ou materiais.
3. Se o cliente perguntar algo sobre 3D que não está no contexto (como dicas de modelagem), use seu conhecimento geral, mas sempre tente relacionar aos serviços da BRCPrint.
4. Se o cliente perguntar o status do pedido, use as informações do contexto.
5. Seja conciso e use formatação markdown (negrito, listas) para facilitar a leitura.
6. Nunca invente dados que não estão no contexto. Se não souber algo sobre o pedido, peça para o cliente aguardar o atendimento humano.

CONTEXTO ATUAL:
${context}`,
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Efficient and smart enough for this
      messages: [systemMessage, ...messages],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Ocorreu um erro ao processar sua solicitação. Tente novamente em alguns instantes.";
  }
}
