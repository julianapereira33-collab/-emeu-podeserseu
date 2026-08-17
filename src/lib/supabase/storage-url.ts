/**
 * Confirma que uma URL aponta pro bucket público de fotos deste projeto — usado antes
 * de aceitar fotos_originais/fotos_tratadas/video_url vindas do cliente e antes de
 * qualquer fetch nesse endereço (gerarFotoEditorial baixa a imagem pra mandar pra IA).
 * Sem isso, uma peça cadastrada com uma URL arbitrária vira um SSRF: o servidor busca
 * qualquer endereço que o cliente mandar.
 */
export function ehUrlDoBucketPecasFotos(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  const prefixo = `${base}/storage/v1/object/public/pecas-fotos/`;
  return url.startsWith(prefixo);
}
