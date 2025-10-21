import axios from 'axios';
import dotenv from 'dotenv';
import { info, warn, error as logError } from '../utils/logger';

dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const key = process.env.AZURE_OPENAI_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini';

export type AnalysisResult = {
  risk: 'High' | 'Medium' | 'Low' | 'Unknown';
  reason: string;
  source: 'azure' | 'mock' | 'error';
}

function mockAnalyze(input: string): AnalysisResult {
  const lower = input.toLowerCase();
  if (/kill|stab|shoot|attack|gun|violence/.test(lower)) {
    return { risk: 'High', reason: 'Violent language detected (heuristic).', source: 'mock' };
  }
  if (/fight|drunk|aggressive|crowd|shouting/.test(lower)) {
    return { risk: 'Medium', reason: 'Aggressive or large crowd behavior detected (heuristic).', source: 'mock' };
  }
  return { risk: 'Low', reason: 'No immediate danger detected (heuristic).', source: 'mock' };
}

export async function analyzeAlert(input: string): Promise<AnalysisResult> {
  // If Azure keys not set, use a simple heuristic mock
  if (!endpoint || !key) {
    info('Azure credentials not found, using mock analysis');
    return mockAnalyze(input);
  }

  try {
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-10-01-preview`;
    const prompt = `You are an AI safety classifier. Analyze this citizen alert. Respond only with a JSON object like { \"risk\": \"High\", \"reason\": \"...\" } without additional text.\n\nAlert:\n"${input.replace(/\"/g, '\\"')}`;

    const resp = await axios.post(url, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    }, {
      headers: {
        'api-key': key,
        'Content-Type': 'application/json'
      }
    });

    const text = resp.data.choices?.[0]?.message?.content || resp.data.choices?.[0]?.text;
    if (!text) {
      warn('Azure response had no content, falling back to mock');
      return mockAnalyze(input);
    }

    // try parse JSON from response
    const jStart = text.indexOf('{');
    const jEnd = text.lastIndexOf('}');
    if (jStart >= 0 && jEnd >= 0) {
      const jsonText = text.slice(jStart, jEnd + 1);
      const parsed = JSON.parse(jsonText);
      info('Analysis returned by Azure:', parsed);
      return { risk: parsed.risk || 'Unknown', reason: parsed.reason || '', source: 'azure' };
    }

    warn('Could not parse JSON from Azure response, falling back to mock');
    return mockAnalyze(input);
  } catch (err: any) {
    logError('Azure OpenAI call failed, falling back to mock:', err?.message || err);
    return { ...mockAnalyze(input), source: 'error' };
  }
}
