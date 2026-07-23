/**
 * Aplica marca d'água simples no browser via canvas antes do upload —
 * substitui o "tratamento de imagem por IA" da Fase 1 por algo que já
 * funciona sem depender de infraestrutura extra de processamento de imagem.
 * Mantém o arquivo original intacto em paralelo (fotos_originais).
 */
export async function aplicarMarcaDagua(file: File, texto = "É meu, pode ser seu"): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado neste navegador");

  ctx.drawImage(bitmap, 0, 0);

  const fontSize = Math.max(16, Math.round(canvas.width / 22));
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = Math.max(1, fontSize / 12);
  ctx.textBaseline = "bottom";

  const margin = fontSize;
  ctx.strokeText(texto, margin, canvas.height - margin);
  ctx.fillText(texto, margin, canvas.height - margin);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem tratada"))),
      "image/jpeg",
      0.9,
    );
  });
}
