const IMAGES_EDIT_URL = "https://api.openai.com/v1/images/edits";

function accessToken() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não configurado");
  return key;
}

/**
 * Gera uma versão "editorial" da foto de uma peça — troca fundo e modelo,
 * mantendo a peça real com fidelidade. Retorna a imagem em base64 (PNG).
 * Resultado precisa de revisão humana antes de ir para a vitrine — geração
 * por IA não garante fidelidade perfeita aos detalhes reais da peça.
 */
export async function gerarFotoEditorialBase64(
  imagemUrl: string,
  descricaoPeca: string,
): Promise<string> {
  const respostaImagem = await fetch(imagemUrl);
  if (!respostaImagem.ok) throw new Error("Não foi possível baixar a foto original da peça.");
  const imagemBlob = await respostaImagem.blob();

  const prompt =
    `Fashion editorial photograph. Show this exact garment worn by a professional fashion model, ` +
    `standing in a natural pose, against a clean neutral studio backdrop. Preserve the garment's real ` +
    `fabric, color, cut, texture and every embellishment with perfect, photorealistic fidelity — do not ` +
    `redesign or alter the piece itself in any way, only the background and the model wearing it. ` +
    `High-end editorial fashion photography, soft studio lighting, hyperrealistic detail. ` +
    `Garment description: ${descricaoPeca}.`;

  const formData = new FormData();
  formData.append("model", "gpt-image-1");
  formData.append("image", imagemBlob, "peca.jpg");
  formData.append("prompt", prompt);
  formData.append("size", "1024x1536");

  const resposta = await fetch(IMAGES_EDIT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken()}` },
    body: formData,
  });

  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(`OpenAI recusou a geração: ${json.error?.message ?? resposta.statusText}`);
  }

  const base64 = json.data?.[0]?.b64_json;
  if (!base64) throw new Error("A OpenAI não retornou uma imagem.");
  return base64;
}
