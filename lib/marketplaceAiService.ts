import { MarketplaceProduct } from './marketplaceData';
import { queryGeminiRealtime } from './geminiRealtimeService';

export interface AiConsultationMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

/**
 * Generate initial greeting & product sales pitch from FitPulse Marketing AI.
 */
export function getInitialAiGreeting(product: MarketplaceProduct): string {
  return `ሰላም! እኔ የ FitPulse ስፖርትና አልሚ ምግብ አማካሪ AI (Marketing AI) ነኝ! 👋

ስለ **${product.title}** ማወቅ የፈለጉትን ማንኛውንም ጥያቄ መጠየቅ ይችላሉ።

💡 **የምርቱ ዋና ጥቅም፦**
${product.benefits.map((b) => `• ${b}`).join('\n')}

💰 **ዋጋ፦** ${product.priceEtb.toLocaleString()} ETB ወይም 🪙 ${product.priceCoins} Coins
${product.pairingSuggestion ? `\n🔥 **የሚመከር ጥምረት፦** ${product.pairingSuggestion}` : ''}

ይህን ምርት መቼ እና እንዴት እንደሚወስዱ ወይም በቅናሽ እንዴት እንደሚገዙ ልርዳዎት?`;
}

/**
 * Send user query about a product to Marketing AI (Gemini Realtime with smart fallback).
 */
export async function queryMarketingAi(
  product: MarketplaceProduct,
  conversationHistory: AiConsultationMessage[],
  userPrompt: string
): Promise<string> {
  const systemPrompt = `You are FitPulse Marketing AI & Sports Nutrition Advisor for the FitPulse Bodybuilder App in Ethiopia.
Your mission is to be an energetic, encouraging, knowledgeable fitness expert and sales advisor.
You speak fluent Amharic (አማርኛ) and English.
You are currently helping a customer who is looking at this product:
- Product Title: ${product.title}
- Brand: ${product.brand}
- Category: ${product.category}
- Price ETB: ${product.priceEtb} ETB
- Price Coins: ${product.priceCoins} FitPulse Coins
- Short Description: ${product.shortDescription}
- Benefits: ${product.benefits.join(', ')}
- Usage Instructions: ${product.usageInstructions}
- Pairing: ${product.pairingSuggestion || 'None'}

Instructions:
1. If the user asks in Amharic, respond warmly in natural Amharic with clean formatting.
2. If the user asks in English, respond in English.
3. Be persuasive, honest, scientifically accurate, and supportive of their fitness journey.
4. Explain how this product accelerates their results (muscle gain, fat loss, or strength).
5. Always remind them they can pay instantly using Chapa (Telebirr/CBE) or FitPulse Coins.
6. Keep responses under 150 words for fast mobile readability.`;

  const isAmharic = /[\u1200-\u137F]/.test(userPrompt);

  // Format conversation history for Gemini
  const formattedHistory = conversationHistory.map((m) => ({
    sender: m.sender === 'user' ? ('ceo' as const) : ('copilot' as const),
    text: m.text,
  }));

  try {
    const aiResponse = await queryGeminiRealtime(userPrompt, {
      category: 'user',
      threadTitle: `Marketplace: ${product.title}`,
      contextSummary: `${systemPrompt}\nCustomer inquiring about: ${product.title} (${product.priceEtb} ETB / ${product.priceCoins} Coins). Benefits: ${product.benefits.join(', ')}. Usage: ${product.usageInstructions}. Pairing: ${product.pairingSuggestion || 'None'}`,
      language: isAmharic ? 'am' : 'en',
      conversationHistory: formattedHistory,
    });
    return aiResponse;
  } catch (err) {
    if (isAmharic) {
      return `ይህ **${product.title}** ለስፖርታዊ እንቅስቃሴዎ ከፍተኛ ጥቅም የሚሰጥ ምርጥ ምርት ነው።
      
📌 **አጠቃቀም፦** ${product.usageInstructions}
💡 **ጠቃሚ ምክር፦** በቂ ውሃ አብረው ይጠጡ እና ከትክክለኛ ልምምድ ጋር ያዋህዱት። 

በ FitPulse Coins ወይም በ Chapa (Telebirr) ወዲያውኑ መግዛት ይችላሉ!`;
    }
    return `**${product.title}** is a top-tier choice for your fitness goals!
    
📌 **How to use:** ${product.usageInstructions}
💡 **Tip:** Consistent training and adequate sleep will multiply your results.

You can order directly using FitPulse Coins or Chapa (Telebirr/CBE)!`;
  }
}
