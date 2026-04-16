import { getApiKey, getModel } from '../storage/apikey';
import { getColors } from '../storage/colors';
import { AppError, parseGeminiError, parseGeminiParseError } from './errorHandler';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MixStep {
  name: string;
  hex: string;
  parts: number;
}

export interface BuyOption {
  name: string;
  brand: string;
  hex: string;
  reason: string;
}

export interface AnalysisResult {
  name: string;
  brand: string | null;
  number: string | null;
  hex: string;
  family: string;
  format: 'pan' | 'tube' | string;
  lightfast: number;
  transparency: number;
  notes: string;
  mix_possible: boolean;
  mix_recipe: MixStep[] | null;
  buy_technical: BuyOption | null;
  buy_compatible: BuyOption | null;
}

export interface InventoryMatch {
  id: string;
  name: string;
  brand: string;
  hex: string;
  similarity: number;
}

export interface CameraAnalysis {
  result: AnalysisResult;
  inventoryMatches: InventoryMatch[];
  status: 'found' | 'mix' | 'buy';
}

// ─── Color distance ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function colorDistance(h1: string, h2: string): number {
  const [r1, g1, b1] = hexToRgb(h1);
  const [r2, g2, b2] = hexToRgb(h2);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function similarityPct(distance: number): number {
  return Math.max(0, Math.round((1 - distance / 441.7) * 100));
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildPrompt(lang: string, inventoryHexes: string): string {
  if (lang === 'es') {
    return `Analiza esta imagen de una acuarela (tubo, pastilla o muestra de color).

El usuario tiene estos colores en su inventario (hex): ${inventoryHexes}

Responde ÚNICAMENTE con un objeto JSON, sin backticks ni texto extra:
{
  "name": "nombre del color tal como aparece en el producto",
  "brand": "marca si es visible, sino null",
  "number": "número de serie o código si es visible, sino null",
  "hex": "color hexadecimal más representativo del pigmento (#rrggbb)",
  "family": "uno de: reds, oranges, yellows, greens, blues, violets, browns, blacks, whites, metallics",
  "format": "pastilla o pomo",
  "lightfast": número del 0 al 3 estimado según el tipo de pigmento,
  "transparency": número del 0 al 5 estimado,
  "notes": "observación breve opcional en español",
  "mix_possible": true o false según si el color podría lograrse mezclando pigmentos del inventario,
  "mix_recipe": SIEMPRE incluir una receta de mezcla aproximada con colores básicos de acuarela, aunque el color esté en el inventario. Formato: [{"name": "nombre", "hex": "#rrggbb", "parts": número}],  "buy_technical": {"name": "nombre del color", "brand": "mejor marca técnica", "hex": "#rrggbb", "reason": "razón técnica breve en español"},
  "buy_compatible": {"name": "nombre del color", "brand": "Van Gogh o Winsor & Newton preferentemente", "hex": "#rrggbb", "reason": "compatible con el inventario existente, en español"}
}`;
  }

  return `Analyze this watercolor image (tube, pan, or color swatch).

The user has these colors in their inventory (hex): ${inventoryHexes}

Respond ONLY with a JSON object, no backticks or extra text:
{
  "name": "color name as it appears on the product",
  "brand": "brand if visible, otherwise null",
  "number": "series number or code if visible, otherwise null",
  "hex": "most representative hex color of the pigment (#rrggbb)",
  "family": "one of: reds, oranges, yellows, greens, blues, violets, browns, blacks, whites, metallics",
  "format": "pan or tube",
  "lightfast": number from 0 to 3 estimated from pigment type,
  "transparency": number from 0 to 5 estimated,
  "notes": "optional brief observation in English",
  "mix_possible": true or false based on whether the color could be achieved by mixing inventory pigments,
  "mix_recipe": ALWAYS include an approximate mixing recipe using basic watercolor pigments, even if the color is in inventory. Format: [{"name": "color name", "hex": "#rrggbb", "parts": number}],  "buy_technical": {"name": "color name", "brand": "technically best brand", "hex": "#rrggbb", "reason": "brief technical reason in English"},
  "buy_compatible": {"name": "color name", "brand": "preferably Van Gogh or Winsor & Newton", "hex": "#rrggbb", "reason": "compatible with existing inventory, in English"}
}`;
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function analyzeColorImage(
  base64Image: string,
  mimeType: string,
  lang: string
): Promise<CameraAnalysis> {
  const apiKey = await getApiKey();
  if (!apiKey) throw { code: 'NO_API_KEY' } as AppError;

  const inventory = await getColors();
  const inventoryHexes = inventory
    .filter(c => c.hex)
    .map(c => `${c.hex}(${c.name})`)
    .join(', ') || 'empty';

  const prompt = buildPrompt(lang, inventoryHexes);

  const model = await getModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    });
  } catch {
    throw { code: 'NETWORK_ERROR' } as AppError;
  }

  if (!response.ok) {
    throw await parseGeminiError(response);
  }

  const data = await response.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) throw parseGeminiParseError();

  const clean = text.replace(/```json\s*|```/gi, '').trim();
  let result: AnalysisResult;
  try {
    result = JSON.parse(clean);
  } catch {
    throw parseGeminiParseError();
  }

  // Calcular coincidencias con inventario
  const matches: InventoryMatch[] = inventory
    .filter(c => c.hex)
    .map(c => ({
      id: c.id,
      name: c.name,
      brand: c.brand,
      hex: c.hex,
      similarity: similarityPct(colorDistance(result.hex, c.hex)),
    }))
    .filter(c => c.similarity >= 60)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  const hasMatch = matches.length > 0 && matches[0].similarity >= 75;
  const canMix =
    !hasMatch &&
    result.mix_possible &&
    Array.isArray(result.mix_recipe) &&
    result.mix_recipe.length > 0;

  const status: CameraAnalysis['status'] = hasMatch
    ? 'found'
    : canMix
    ? 'mix'
    : 'buy';

  return { result, inventoryMatches: matches, status };
}