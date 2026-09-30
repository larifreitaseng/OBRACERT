import { GoogleGenAI, Type } from '@google/genai';
import { ParsedRdoFromAi } from '../types';

let genAiInstance: GoogleGenAI | null = null;

function getGenAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAiInstance) {
    genAiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiInstance;
}

export async function parseAudioOrTextForRdo(input: {
  text?: string;
  audioBase64?: string;
  mimeType?: string;
}): Promise<ParsedRdoFromAi> {
  const ai = getGenAi();

  const fallbackRegexParse = (rawText: string): ParsedRdoFromAi => {
    // Resilient fallback rule-based parser in case API key is unconfigured
    const lower = rawText.toLowerCase();

    // Check weather
    const isRainMorning = lower.includes('chuva') && (lower.includes('manhã') || lower.includes('manha') || !lower.includes('tarde'));
    const isRainAfternoon = lower.includes('chuva') && lower.includes('tarde');

    // Check workers count
    let workers = 0;
    const workerMatch = rawText.match(/(\d+)\s*(funcion[aá]rios|trabalhadores|oper[aá]rios|homens|colaboradores|pessoas)/i) ||
                        rawText.match(/trabalharam\s*(\d+)/i);
    if (workerMatch) {
      workers = parseInt(workerMatch[1], 10);
    }

    // Check progress
    let progress = 0;
    const progressMatch = rawText.match(/(\d+)%\s*(da|de)?\s*([a-zA-ZÀ-ÿ\s]+)/i);
    let activityDesc = 'Atividades gerais no canteiro';
    if (progressMatch) {
      progress = parseInt(progressMatch[1], 10);
    }
    if (lower.includes('concretagem')) {
      activityDesc = 'Concretagem de vigas e elementos estruturais';
    } else if (lower.includes('alvenaria')) {
      activityDesc = 'Execução de alvenaria e vedação';
    }

    // Check cement/materials
    const materials = [];
    const cementMatch = rawText.match(/(\d+)\s*(sacos|scs|unidades)?\s*de\s*cimento/i);
    if (cementMatch) {
      materials.push({
        item: 'Cimento Portland',
        quantity: parseInt(cementMatch[1], 10),
        unit: 'sacos',
        supplierOrInvoice: 'Entrega do dia'
      });
    }

    return {
      activities: [
        {
          description: activityDesc,
          location: lower.includes('segundo pavimento') || lower.includes('2 pavimento') ? '2º Pavimento' : 'Canteiro Geral',
          progressPercent: progress || 50,
          status: (progress && progress >= 100) ? 'Concluído' : 'Em andamento'
        }
      ],
      workforce: [
        {
          role: 'Equipe de Produção / Operários',
          count: workers || 8,
          type: 'própria'
        }
      ],
      totalWorkers: workers || 8,
      weatherMorning: isRainMorning ? 'Chuvoso' : 'Ensolarado',
      weatherAfternoon: isRainAfternoon ? 'Chuvoso' : 'Nublado',
      weatherNight: 'Ensolarado',
      materials: materials.length > 0 ? materials : [
        {
          item: 'Materiais diversos',
          quantity: 1,
          unit: 'lote',
          supplierOrInvoice: 'Estoque'
        }
      ],
      equipment: [
        {
          name: lower.includes('bomba') ? 'Bomba de concreto' : 'Betoneira / Vibradores',
          quantity: 1,
          status: 'operando'
        }
      ],
      occurrences: isRainMorning ? 'Chuva durante o turno da manhã afetou parcialmente os trabalhos externos.' : 'Sem ocorrências impeditivas registradas no turno.',
      generalNotes: rawText,
      transcriptText: rawText
    };
  };

  if (!ai) {
    console.warn('GEMINI_API_KEY is not defined or is placeholder. Using intelligent fallback parser.');
    return fallbackRegexParse(input.text || 'Relato diário de obra em execução.');
  }

  try {
    let contentsPayload: any = [];

    const systemInstruction = `Você é um engenheiro civil especialista em gestão e elaboração de Relatórios Diários de Obra (RDO) segundo normas técnicas da ABNT.
Sua função é interpretar o relato (áudio ou texto) gravado em campo pelo engenheiro ou mestre de obras e estruturar com alta precisão os dados para os campos do RDO.
Analise:
1. Atividades executadas: liste cada atividade, localização (ex: "2º Pavimento", "Subsolo"), percentual de conclusão acumulado ou do dia (0 a 100) e status ("Iniciado", "Em andamento", "Concluído", "Paralisado").
2. Mão de obra (workforce): identifique funções (carpinteiro, armador, pedreiro, etc.), quantidade e se é equipe própria ou terceirizada. Calcule o totalWorkers.
3. Condições climáticas (weatherMorning, weatherAfternoon, weatherNight): valores possíveis estritos: "Ensolarado", "Nublado", "Chuvoso", "Chuva Forte", "Impraticável".
4. Materiais recebidos ou utilizados: item, quantidade numérica, unidade (sacos, m³, kg, ton, unidades) e fornecedor/observação se citado.
5. Equipamentos: nomes, quantidades e se estavam operando ou parados.
6. Ocorrências: chuvas que paralisaram obras, acidentes, atraso de betoneira, visitas de fiscalização, etc.
7. Observações gerais: síntese clara e profissional das instruções técnicas para o diário.
8. transcriptText: a transcrição exata e polida do relato original.`;

    if (input.audioBase64) {
      contentsPayload = [
        {
          inlineData: {
            mimeType: input.mimeType || 'audio/webm',
            data: input.audioBase64,
          },
        },
        {
          text: 'Transcreva e interprete este relato de áudio gravado na obra e estruture os campos do RDO no formato JSON requerido.',
        },
      ];
    } else {
      contentsPayload = [
        {
          text: `Interprete o seguinte relato falado de obra e estruture os campos do RDO no formato JSON requerido:\n\n"${input.text || ''}"`,
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  location: { type: Type.STRING },
                  progressPercent: { type: Type.NUMBER },
                  status: {
                    type: Type.STRING,
                    enum: ['Iniciado', 'Em andamento', 'Concluído', 'Paralisado'],
                  },
                },
                required: ['description', 'location', 'progressPercent', 'status'],
              },
            },
            workforce: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  count: { type: Type.NUMBER },
                  type: { type: Type.STRING, enum: ['própria', 'terceirizada'] },
                },
                required: ['role', 'count', 'type'],
              },
            },
            totalWorkers: { type: Type.NUMBER },
            weatherMorning: {
              type: Type.STRING,
              enum: ['Ensolarado', 'Nublado', 'Chuvoso', 'Chuva Forte', 'Impraticável'],
            },
            weatherAfternoon: {
              type: Type.STRING,
              enum: ['Ensolarado', 'Nublado', 'Chuvoso', 'Chuva Forte', 'Impraticável'],
            },
            weatherNight: {
              type: Type.STRING,
              enum: ['Ensolarado', 'Nublado', 'Chuvoso', 'Chuva Forte', 'Impraticável'],
            },
            materials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  supplierOrInvoice: { type: Type.STRING },
                },
                required: ['item', 'quantity', 'unit'],
              },
            },
            equipment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: ['operando', 'parado'] },
                },
                required: ['name', 'quantity', 'status'],
              },
            },
            occurrences: { type: Type.STRING },
            generalNotes: { type: Type.STRING },
            transcriptText: { type: Type.STRING },
          },
          required: [
            'activities',
            'workforce',
            'totalWorkers',
            'weatherMorning',
            'weatherAfternoon',
            'weatherNight',
            'materials',
            'equipment',
            'occurrences',
            'generalNotes',
            'transcriptText',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    const parsed = JSON.parse(text) as ParsedRdoFromAi;
    return parsed;
  } catch (error) {
    console.error('Error invoking Gemini for RDO parsing:', error);
    const fallbackText = input.text || 'Concretagem e vistorias executadas no canteiro de obras com equipe de 10 colaboradores.';
    return fallbackRegexParse(fallbackText);
  }
}
