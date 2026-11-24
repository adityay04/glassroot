import { ScanResult } from '../../types';
import { getFixedVersions } from '../osv';

export const generateAIAnalysis = async (apiKey: string, scanResults: ScanResult[]) => {
  const compactResults = scanResults.map(pkg => ({
    name: pkg.name,
    requestedVersion: pkg.versionRange,
    resolvedVersion: pkg.resolvedVersion ?? 'unresolved',
    risk: pkg.riskLabel,
    signals: pkg.signals,
    riskFactors: pkg.riskFactors ?? [],
    vulns: pkg.vulnerabilities.map(v => ({
      id: v.id,
      summary: v.summary,
      severity: v.severity?.map(severity => ({
        type: severity.type,
        score: severity.baseScore,
      })),
      fixedVersions: pkg.resolvedVersion ? getFixedVersions(v, pkg.resolvedVersion, pkg.name) : [],
    }))
  }));

  const prompt = `
    You are GLASS//ROOT, an expert software supply chain security AI.
    Analyze the following dependency scan results:
    
    ${JSON.stringify(compactResults)}

    STRICT RULES:
    1. DO NOT invent vulnerabilities. Only use the provided data.
    2. Distinguish clearly between confirmed vulnerabilities (from OSV) and suspicious signals.
    3. Explain the findings in simple terms a junior developer would understand.
    4. Provide actionable, prioritized remediation steps.
    5. Keep your response concise to save tokens.
    
    Format your response cleanly using plain text. Use all caps for section headers like "SUMMARY", "PRIORITY ACTIONS", and "DETAILS".
  `;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch from Groq API');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'NO_ANALYSIS_RETURNED';
  } catch (error: any) {
    console.error('[GROQ_API_ERROR]', error);
    throw new Error(error.message || 'Failed to generate AI analysis. Check console for details.');
  }
};