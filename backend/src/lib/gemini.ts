/**
 * Resilient Gemini AI Service with Multi-Key Rotation & Auto-Fallback
 * Automatically cycles through available API keys when one hits rate limits or exhaustion.
 */

interface GeminiMessage {
  role: 'user' | 'model' | 'system'
  content: string
}

export class GeminiService {
  private static keyIndex = 0

  private static getApiKeys(): string[] {
    const rawKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0)

    // Return deduplicated list of non-empty keys
    return Array.from(new Set(rawKeys))
  }

  private static getModels(): string[] {
    const primary = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    const fallbackList = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
    return Array.from(new Set([primary, ...fallbackList]))
  }

  public static async generateFinancialAdvice(
    systemPrompt: string,
    userQuery: string
  ): Promise<{ response: string; modelUsed: string; keyIndexUsed: number } | null> {
    const keys = this.getApiKeys()
    if (keys.length === 0) {
      console.warn('⚠️ [GeminiService] No Gemini API keys configured.')
      return null
    }

    const models = this.getModels()
    const startIndex = this.keyIndex % keys.length

    // Try keys sequentially in pool
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const activeKeyIndex = (startIndex + attempt) % keys.length
      const activeKey = keys[activeKeyIndex]

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`

          const payload = {
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemPrompt}\n\nUSER QUESTION: ${userQuery}\n\nPlease provide a clear, accurate, and actionable response in Markdown format.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (response.ok) {
            const data = await response.json()
            const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text
            if (candidateText && candidateText.trim().length > 0) {
              // Update last successful key index
              this.keyIndex = activeKeyIndex
              return {
                response: candidateText.trim(),
                modelUsed: model,
                keyIndexUsed: activeKeyIndex + 1,
              }
            }
          }

          const errorBody = await response.json().catch(() => ({}))
          const errorMsg = errorBody?.error?.message || response.statusText
          const status = response.status

          console.warn(
            `⚠️ [GeminiService] Key #${activeKeyIndex + 1} (${model}) failed [${status}]: ${errorMsg}`
          )

          // If rate limited, quota exhausted, or forbidden, break model loop to try next key immediately
          if (
            status === 429 ||
            status === 403 ||
            errorMsg.toLowerCase().includes('quota') ||
            errorMsg.toLowerCase().includes('exhausted')
          ) {
            console.warn(`🔄 [GeminiService] Key #${activeKeyIndex + 1} exhausted/limited. Rotating to next key...`)
            break
          }
        } catch (err: any) {
          console.error(`❌ [GeminiService] Network exception on Key #${activeKeyIndex + 1}:`, err?.message || err)
          break
        }
      }
    }

    console.error('❌ [GeminiService] All Gemini API keys exhausted or failed.')
    return null
  }
}
