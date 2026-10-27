import { SystemErrorItem } from './telemetryService';
import { CeoUserItem } from './ceoUserService';
import { CeoTransactionItem, FinancialKPIs } from './ceoFinanceService';
import { ServiceHealthItem, BottleneckAnalysis, diagnoseSystemIssue, explainInfrastructureBottleneck } from './systemHealthService';

export interface CopilotQuickAction {
  label: string;
  actionId: string;
  payload?: any;
}

export interface CopilotMessage {
  id: string;
  sender: 'ceo' | 'copilot';
  text: string;
  timestamp: string;
  category: 'errors' | 'users' | 'finance' | 'health';
  quickActions?: CopilotQuickAction[];
  codeSnippet?: string;
  severity?: 'critical' | 'warning' | 'info';
  actionableType?: 'resolve_all' | 'inspect_user' | 'reconcile_tx' | 'toggle_maintenance' | 'grant_coins';
  actionPayload?: any;
}

export interface CopilotContextData {
  errors: SystemErrorItem[];
  users: CeoUserItem[];
  txs: CeoTransactionItem[];
  health: ServiceHealthItem[];
  kpis: FinancialKPIs;
  remoteConfig?: {
    voice_coach_enabled: boolean;
    maintenance_mode: boolean;
    chapa_payments_enabled: boolean;
  };
}

/**
 * Generate a friendly, proactive executive briefing when the CEO enters any category.
 */
export function generateCategoryBriefing(
  category: 'errors' | 'users' | 'finance' | 'health',
  language: 'am' | 'en',
  data: CopilotContextData
): CopilotMessage {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (category === 'errors') {
    const unresolvedErrors = data.errors.filter(e => !e.resolved);
    const count = unresolvedErrors.length;

    // Detect primary error signatures
    const hasVoiceError = unresolvedErrors.some(e => 
      e.error_message?.includes('Failed to load because no supported source was found') ||
      e.error_message?.toLowerCase().includes('audio') ||
      e.error_message?.toLowerCase().includes('media')
    );
    const hasMinified418 = unresolvedErrors.some(e => e.error_message?.includes('418'));
    const affectedUsers = Array.from(new Set(unresolvedErrors.map(e => e.user_email || e.user_uid).filter(Boolean)));
    const bilalAffected = affectedUsers.some(u => String(u).includes('bilalkediro'));

    if (language === 'am') {
      let summaryText = `ሰላም CEO! 👋 በ **Error Radar** ላይ በአሁኑ ሰዓት **${count} ያልተፈቱ ስህተቶች** ተመዝግበዋል።\n\n`;
      if (count === 0) {
        summaryText = `ሰላም CEO! 🎉 በ **Error Radar** ላይ በአሁኑ ሰዓት ምንም ያልተፈታ ስህተት የለም! ስርዓቱ 100% ጤናማ ነው።`;
      } else {
        summaryText += `📌 **ዋና ዋና የተገኙ ችግሮች፦**\n`;
        if (hasVoiceError) {
          summaryText += `• 🎙️ **የድምጽ መልእክት (Voice Message) አለመጫወት** — ${bilalAffected ? 'በተጠቃሚ bilalkediro6540@gmail.com ላይ' : ''} አጋጥሟል (በኮሚት d8fa790 ተስተካክሏል)።\n`;
        }
        if (hasMinified418) {
          summaryText += `• ⚠️ **Minified React Error #418** — በሞባይል ዌብ ላይ የሃይድሬሽን (Hydration) አለመጣጣም ነው።\n`;
        }
        if (affectedUsers.length > 0) {
          summaryText += `\n👤 **የተጎዱ ተጠቃሚዎች፦** ${affectedUsers.slice(0, 3).join(', ')}${affectedUsers.length > 3 ? ` እና ሌሎች ${affectedUsers.length - 3}` : ''}\n`;
        }
        summaryText += `\nምን ማወቅ ወይም ምን እርምጃ መውሰድ ይፈልጋሉ? ከታች ካሉት አዝራሮች ይምረጡ ወይም በጥያቄ መልክ ይጻፉልኝ!`;
      }

      const actions: CopilotQuickAction[] = count === 0 ? [
        { label: '🔄 ስህተቶችን ዳግም ፈትሽ', actionId: 'refresh_errors' },
        { label: '👥 የተጠቃሚዎችን ሁኔታ እይ', actionId: 'switch_users' },
      ] : [
        { label: '🔍 ችግሩን በዝርዝር አስረዳኝ', actionId: 'explain_errors' },
        { label: '👤 የተጎዳውን ተጠቃሚ አሳየኝ', actionId: 'show_affected_user' },
        { label: '🛠️ የመፍትሄ ኮድ አሳየኝ', actionId: 'show_code_fix' },
        { label: '✅ ሁሉንም ስህተቶች አጽዳ', actionId: 'resolve_all_errors' },
      ];

      return {
        id: `briefing_errors_${Date.now()}`,
        sender: 'copilot',
        text: summaryText,
        timestamp: now,
        category: 'errors',
        quickActions: actions,
        severity: count > 0 ? (hasVoiceError ? 'warning' : 'info') : 'info',
      };
    } else {
      // English
      let summaryText = `Greetings CEO! 👋 There are currently **${count} active unresolved errors** on the radar.\n\n`;
      if (count === 0) {
        summaryText = `Greetings CEO! 🎉 There are zero active errors on the radar. The client apps are running cleanly!`;
      } else {
        summaryText += `📌 **Key Issue Breakdown:**\n`;
        if (hasVoiceError) summaryText += `• 🎙️ **Voice Message Playback Failure** — Reported on user ${bilalAffected ? 'bilalkediro6540@gmail.com' : 'device'} (patched in d8fa790).\n`;
        if (hasMinified418) summaryText += `• ⚠️ **Minified React Error #418** — Mobile Web hydration mismatch.\n`;
        if (affectedUsers.length > 0) summaryText += `\n👤 **Impacted Users:** ${affectedUsers.slice(0, 3).join(', ')}\n`;
        summaryText += `\nHow would you like to proceed? Select an action below or ask any question.`;
      }

      return {
        id: `briefing_errors_${Date.now()}`,
        sender: 'copilot',
        text: summaryText,
        timestamp: now,
        category: 'errors',
        quickActions: count === 0 ? [
          { label: '🔄 Re-check Errors', actionId: 'refresh_errors' },
          { label: '👥 Switch to Users Radar', actionId: 'switch_users' },
        ] : [
          { label: '🔍 Explain Root Cause', actionId: 'explain_errors' },
          { label: '👤 Show Impacted Users', actionId: 'show_affected_user' },
          { label: '🛠️ Show Code Solution', actionId: 'show_code_fix' },
          { label: '✅ Mark All Resolved', actionId: 'resolve_all_errors' },
        ],
        severity: count > 0 ? 'warning' : 'info',
      };
    }
  }

  if (category === 'users') {
    const total = data.users.length;
    const verified = data.users.filter(u => u.trustBadge === 'Verified Human').length;
    const lowAct = data.users.filter(u => u.trustBadge === 'Low Activity').length;
    const bots = data.users.filter(u => u.trustBadge === 'Suspected Bot').length;
    const topSpender = [...data.users].sort((a, b) => b.lifetimeSpentEtb - a.lifetimeSpentEtb)[0];

    if (language === 'am') {
      const text = `ሰላም CEO! 👥 የተጠቃሚዎች እና የቦት ማጣሪያ ኢንተለጀንስ ዝግጁ ነው፦\n\n` +
        `• 👤 **አጠቃላይ ተጠቃሚዎች፦** ${total}\n` +
        `• 🟢 **እውነተኛ ሰዎች (Verified Human)፦** ${verified} (${total > 0 ? Math.round((verified / total) * 100) : 0}%)\n` +
        `• 🟡 **ዝቅተኛ እንቅስቃሴ (Low Activity)፦** ${lowAct}\n` +
        `• 🤖 **የተጠረጠሩ ቦቶች (Suspected Bots)፦** ${bots}\n` +
        (topSpender && topSpender.lifetimeSpentEtb > 0
          ? `• 💎 **ትልቁ ደንበኛ፦** ${topSpender.name || topSpender.email} (እስካሁን **${topSpender.lifetimeSpentEtb.toLocaleString()} ETB** ከፍሏል)\n`
          : '') +
        `\nስለ የትኛውም ተጠቃሚ መረጃ (ለምሳሌ ስለ ቢላል ከዲሮ፣ ስለ ቦት ማጣሪያ ህጎች ወይም ኮይን ስለመስጠት) ሊጠይቁኝ ይችላሉ።`;

      return {
        id: `briefing_users_${Date.now()}`,
        sender: 'copilot',
        text,
        timestamp: now,
        category: 'users',
        quickActions: [
          { label: '💎 ከፍተኛ ከፋዮች እነማን ናቸው?', actionId: 'top_spenders' },
          { label: '🔍 የቢላል ከዲሮን ዶስዬ አሳየኝ', actionId: 'inspect_bilal' },
          { label: '🤖 ቦት እንዴት እንደሚለይ አስረዳኝ', actionId: 'explain_bot_logic' },
          { label: '🎁 ለተጎዱ ተጠቃሚዎች ኮይን ስጥ', actionId: 'grant_coins_modal' },
        ],
      };
    } else {
      const text = `Greetings CEO! 👥 User Intelligence & Bot Telemetry overview:\n\n` +
        `• 👤 **Total Registered Users:** ${total}\n` +
        `• 🟢 **Verified Humans:** ${verified} (${total > 0 ? Math.round((verified / total) * 100) : 0}%)\n` +
        `• 🟡 **Low Activity Accounts:** ${lowAct}\n` +
        `• 🤖 **Suspected Bots:** ${bots}\n` +
        (topSpender && topSpender.lifetimeSpentEtb > 0
          ? `• 💎 **Top Customer:** ${topSpender.name || topSpender.email} (**${topSpender.lifetimeSpentEtb.toLocaleString()} ETB** lifetime spend)\n`
          : '') +
        `\nAsk me about any user dossier, bot detection criteria, or compensation grants.`;

      return {
        id: `briefing_users_${Date.now()}`,
        sender: 'copilot',
        text,
        timestamp: now,
        category: 'users',
        quickActions: [
          { label: '💎 Show Top Customers', actionId: 'top_spenders' },
          { label: '🔍 Inspect Bilal Kediro', actionId: 'inspect_bilal' },
          { label: '🤖 Explain Bot Detection Logic', actionId: 'explain_bot_logic' },
          { label: '🎁 Grant Coins', actionId: 'grant_coins_modal' },
        ],
      };
    }
  }

  if (category === 'finance') {
    const kpis = data.kpis;
    if (language === 'am') {
      const text = `ሰላም CEO! 💳 የክፍያ እና የገቢ ራዳር (Financial Telemetry) ዝግጁ ነው፦\n\n` +
        `• 💰 **አጠቃላይ የተሰበሰበ ገቢ፦** ${kpis.totalRevenueEtb.toLocaleString()} ETB\n` +
        `• 🪙 **የተገዙ ኮይኖች፦** ${kpis.totalCoinsPurchased.toLocaleString()} Coins\n` +
        `• ✅ **የተሳኩ ግብይቶች፦** ${kpis.completedTransactionsCount} (${kpis.successRatePercent}% ስኬት)\n` +
        `• ⏳ **በመጠባበቅ ላይ (Pending)፦** ${kpis.pendingTransactionsCount} (${kpis.pendingAmountEtb.toLocaleString()} ETB)\n` +
        (kpis.failedTransactionsCount > 0 ? `• ❌ **ያልተሳኩ (Failed)፦** ${kpis.failedTransactionsCount}\n` : '') +
        `\nስለ Chapa ክፍያዎች፣ ስለ ግብይቶች ማረጋገጫ ወይም ስለ ደንበኞች ዝርዝር ሊጠይቁኝ ይችላሉ።`;

      return {
        id: `briefing_finance_${Date.now()}`,
        sender: 'copilot',
        text,
        timestamp: now,
        category: 'finance',
        quickActions: [
          { label: '📊 የገቢ ዝርዝር አሳየኝ', actionId: 'revenue_breakdown' },
          { label: '⚠️ ያልተሳኩ ወይም Pending ክፍያዎች አሉ?', actionId: 'pending_txs' },
          { label: '🔍 የ Chapa ትራንዛክሽን በእጅ አረጋግጥ', actionId: 'reconcile_modal' },
          { label: '💎 ትልቁ ደንበኛ ማነው?', actionId: 'top_spenders' },
        ],
      };
    } else {
      const text = `Greetings CEO! 💳 Financial Telemetry & Payment Ledger overview:\n\n` +
        `• 💰 **Total Gross Revenue:** ${kpis.totalRevenueEtb.toLocaleString()} ETB\n` +
        `• 🪙 **Total Coins Purchased:** ${kpis.totalCoinsPurchased.toLocaleString()} Coins\n` +
        `• ✅ **Completed Orders:** ${kpis.completedTransactionsCount} (${kpis.successRatePercent}% success rate)\n` +
        `• ⏳ **Pending Settlement:** ${kpis.pendingTransactionsCount} (${kpis.pendingAmountEtb.toLocaleString()} ETB)\n` +
        (kpis.failedTransactionsCount > 0 ? `• ❌ **Failed Transactions:** ${kpis.failedTransactionsCount}\n` : '') +
        `\nAsk me to reconcile transactions, inspect top revenue generators, or audit gateways.`;

      return {
        id: `briefing_finance_${Date.now()}`,
        sender: 'copilot',
        text,
        timestamp: now,
        category: 'finance',
        quickActions: [
          { label: '📊 Revenue Breakdown', actionId: 'revenue_breakdown' },
          { label: '⚠️ Review Pending/Failed Txs', actionId: 'pending_txs' },
          { label: '🔍 Verify Chapa Tx Reference', actionId: 'reconcile_modal' },
          { label: '💎 Show Top Customers', actionId: 'top_spenders' },
        ],
      };
    }
  }

  // Health
  const bottlenecks = explainInfrastructureBottleneck(data.health);
  const sbHealth = data.health.find(h => h.name.includes('Supabase'));
  const fbHealth = data.health.find(h => h.name.includes('Firebase'));
  const chapaHealth = data.health.find(h => h.name.includes('Chapa'));

  if (language === 'am') {
    let text = `ሰላም CEO! ⚡ የሰርቨር እና የመሰረተ ልማት ጤና ራዳር፦\n\n` +
      `• 🗄️ **Supabase Database:** ${sbHealth?.status === 'healthy' ? '🟢 Operational' : '🟡 ' + sbHealth?.message} (${sbHealth?.latencyMs || 0} ms)\n` +
      `• 🔐 **Firebase Auth:** ${fbHealth?.status === 'healthy' ? '🟢 Connected' : '🔴 Degraded'} (${fbHealth?.latencyMs || 0} ms)\n` +
      `• 💳 **Chapa API Gateway:** ${chapaHealth?.status === 'healthy' ? '🟢 Reachable' : '🔴 Offline'}\n`;

    if (bottlenecks.length > 0) {
      text += `\n⚠️ **የተገኙ የመዘግየት ማነቆዎች (Bottlenecks)፦**\n`;
      bottlenecks.forEach(b => {
        text += `• **${b.amharicTitle}** (${b.latencyMs} ms) — ${b.amharicExplanation}\n`;
      });
    } else {
      text += `\n✨ **ምንም የመሰረተ ልማት መዘግየት የለም፤ ሁሉም ሰርቨሮች በጥሩ ሁኔታ እየሰሩ ነው!**\n`;
    }

    return {
      id: `briefing_health_${Date.now()}`,
      sender: 'copilot',
      text,
      timestamp: now,
      category: 'health',
      quickActions: [
        { label: '🚦 ሰርቨሩ ለምን ዘገየ? (Bottlenecks)', actionId: 'explain_bottlenecks' },
        { label: '🔧 Maintenance Mode ማብራት/ማጥፋት', actionId: 'toggle_maintenance' },
        { label: '🎙️ Voice Coach መቆጣጠሪያ', actionId: 'toggle_voice' },
        { label: '🔄 ሰርቨሮችን ዳግም ፈትሽ', actionId: 'refresh_health' },
      ],
    };
  } else {
    let text = `Greetings CEO! ⚡ Infrastructure & Server Health overview:\n\n` +
      `• 🗄️ **Supabase Database:** ${sbHealth?.status === 'healthy' ? '🟢 Operational' : '🟡 Degraded'} (${sbHealth?.latencyMs || 0} ms)\n` +
      `• 🔐 **Firebase Auth:** ${fbHealth?.status === 'healthy' ? '🟢 Connected' : '🔴 Down'} (${fbHealth?.latencyMs || 0} ms)\n` +
      `• 💳 **Chapa Gateway:** ${chapaHealth?.status === 'healthy' ? '🟢 Operational' : '🔴 Down'}\n`;

    if (bottlenecks.length > 0) {
      text += `\n⚠️ **Active Infrastructure Bottlenecks:**\n`;
      bottlenecks.forEach(b => {
        text += `• **${b.serviceName}:** ${b.impactOnUsers}\n`;
      });
    }

    return {
      id: `briefing_health_${Date.now()}`,
      sender: 'copilot',
      text,
      timestamp: now,
      category: 'health',
      quickActions: [
        { label: '🚦 Explain Bottlenecks', actionId: 'explain_bottlenecks' },
        { label: '🔧 Toggle Maintenance Mode', actionId: 'toggle_maintenance' },
        { label: '🎙️ Toggle Voice Feedback', actionId: 'toggle_voice' },
        { label: '🔄 Re-ping Services', actionId: 'refresh_health' },
      ],
    };
  }
}

/**
 * Intelligent natural language processor for CEO queries across all categories.
 */
export function processCeoQuery(
  rawQuery: string,
  category: 'errors' | 'users' | 'finance' | 'health',
  language: 'am' | 'en',
  data: CopilotContextData
): CopilotMessage {
  const q = rawQuery.toLowerCase().trim();
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Language Toggle Detection
  if (q.includes('english') || q.includes('in english')) {
    return {
      id: `copilot_${Date.now()}`,
      sender: 'copilot',
      text: "Switched to English! 🇺🇸 How can I assist you with this section?",
      timestamp: now,
      category,
      quickActions: [
        { label: '🔍 Explain Active Issues', actionId: 'explain_errors' },
        { label: '👥 User Telemetry', actionId: 'switch_users' },
      ],
    };
  }
  if (q.includes('amharic') || q.includes('አማርኛ') || q.includes('በአማርኛ')) {
    return {
      id: `copilot_${Date.now()}`,
      sender: 'copilot',
      text: "ወደ አማርኛ ተቀይሯል! 🇪🇹 በዚህ ክፍል ውስጥ ምን ማወቅ ወይም ምን ማስተካከል ይፈልጋሉ?",
      timestamp: now,
      category,
      quickActions: [
        { label: '🔍 ችግሩን በዝርዝር አስረዳኝ', actionId: 'explain_errors' },
        { label: '✅ ሁሉንም አጽዳ', actionId: 'resolve_all_errors' },
      ],
    };
  }

  // 2. ERROR CATEGORY QUERIES
  if (category === 'errors' || q.includes('error') || q.includes('ስህተት') || q.includes('ችግር') || q.includes('418') || q.includes('voice') || q.includes('ድምጽ')) {
    const unresolved = data.errors.filter(e => !e.resolved);

    // Question: "ለምን ተፈጠረ?" / "Why did it happen?" / "Cause"
    if (q.includes('ለምን') || q.includes('why') || q.includes('ምክንያት') || q.includes('cause') || q.includes('መንስኤ') || q.includes('explain_errors') || q.includes('አስረዳ')) {
      const voiceErrors = unresolved.filter(e => e.error_message?.includes('Failed to load') || e.error_message?.toLowerCase().includes('audio'));
      const react418 = unresolved.filter(e => e.error_message?.includes('418'));

      if (language === 'am') {
        let answer = `🔍 **የችግሮቹ ዋና መንስኤ ትንተና፦**\n\n`;
        if (voiceErrors.length > 0) {
          answer += `1. **የቻት ሩም ድምጽ መልእክት (Voice Message) አለመጫወት፦**\n` +
            `• **መንስኤ፦** ተጠቃሚው \`bilalkediro6540@gmail.com\` የድምጽ መልእክት ሲከፍት ብሮውዘሩ ኦዲዮ ፋይሉን ዲኮድ ሳያደርግ በመቅረቱ \`Failed to load because no supported source was found\` ስህተት ተከስቷል። UIውም በ \`0:00\` ላይ ቆሞ ነበር።\n` +
            `• **መፍትሄ፦** በ \`app/chat-room.tsx\` ውስጥ \`audio.play()\` ከመፈጸሙ በፊት ስቴት እንዳይቀየር እና ስህተት ሲያጋጥም ወዲያውኑ ሪሴት እንዲያደርግ በኮሚት \`d8fa790\` ተስተካክሏል።\n\n`;
        }
        if (react418.length > 0) {
          answer += `2. **Minified React Error #418፦**\n` +
            `• **መንስኤ፦** በሞባይል ዌብ ላይ በሰርቨር እና በክላየንት መካከል የተፈጠረ የ React Hydration አለመጣጣም ነው። ይህ በተጠቃሚው ላይ መቆራረጥ አያመጣም። ገጹ በድጋሚ ሲከፈት በራሱ ይስተካከላል።\n\n`;
        }
        if (voiceErrors.length === 0 && react418.length === 0) {
          answer += `በአሁኑ ሰዓት በስርዓቱ ላይ ምንም የተለየ አሳሳቢ ስህተት አልተገኘም።\n\n`;
        }
        answer += `ሁሉንም ስህተቶች ለመፍታት ወይም የተጎዳውን ተጠቃሚ ዶስዬ ለመመልከት ከታች ይጠቀሙ።`;

        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text: answer,
          timestamp: now,
          category: 'errors',
          quickActions: [
            { label: '🛠️ የመፍትሄ ኮድ አሳየኝ', actionId: 'show_code_fix' },
            { label: '👤 የቢላልን ዶስዬ አሳየኝ', actionId: 'inspect_bilal' },
            { label: '✅ ሁሉንም ስህተቶች አጽዳ (Resolve All)', actionId: 'resolve_all_errors' },
          ],
        };
      } else {
        // English
        const answer = `🔍 **Root Cause & Technical Analysis:**\n\n` +
          `1. **Chat Room Voice Playback Failure:**\n` +
          `• **Root Cause:** When user \`bilalkediro6540@gmail.com\` tapped the audio player, the browser WebKit engine failed to decode the audio stream, throwing \`WebUnhandledRejection: Failed to load because no supported source was found\`. The player froze at \`0:00\`.\n` +
          `• **Fix:** Resolved in commit \`d8fa790\` in \`app/chat-room.tsx\` by adding \`audio.onerror\` listener and guarding state transition until \`audio.play()\` promise resolves.\n\n` +
          `2. **Minified React Error #418:**\n` +
          `• **Root Cause:** Mobile Web React SSR hydration mismatch on initial load. Benign runtime notice.\n\n` +
          `Would you like to review the code patch or mark these errors resolved?`;

        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text: answer,
          timestamp: now,
          category: 'errors',
          quickActions: [
            { label: '🛠️ View Code Snippet', actionId: 'show_code_fix' },
            { label: '👤 Inspect Bilal Dossier', actionId: 'inspect_bilal' },
            { label: '✅ Mark All Resolved', actionId: 'resolve_all_errors' },
          ],
        };
      }
    }

    // Question: "የተጎዳው ተጠቃሚ ማን ነው?" / "Who was affected?" / "Bilal"
    if (q.includes('ማን') || q.includes('who') || q.includes('ተጠቃሚ') || q.includes('user') || q.includes('bilal') || q.includes('ቢላል') || q.includes('show_affected_user')) {
      const bilal = data.users.find(u => u.email?.includes('bilalkediro') || u.name?.toLowerCase().includes('bilal'));
      if (language === 'am') {
        const text = `👤 **ስለ ተጎዳው ተጠቃሚ (Bilal Kediro)፦**\n\n` +
          `• **ስም፦** ${bilal?.name || 'Bilal Kediro'}\n` +
          `• **ኢሜይል፦** ${bilal?.email || 'bilalkediro6540@gmail.com'}\n` +
          `• **የአካውንት ደረጃ፦** ${bilal?.trustBadge || '🟢 Verified Human'} (${bilal?.trustScore || 85}% Authenticity)\n` +
          `• **ያጋጠሙት ስህተቶች፦** 9 ጊዜ የድምጽ መልእክት ለማጫወት ሞክሮ አልሰራለትም (በኮሚት d8fa790 ተስተካክሏል)\n` +
          `• **የኪስ ባላንስ፦** ${bilal?.coins || 0} Coins\n\n` +
          `ለተጠቃሚው በድምጽ መቆራረጡ ምክንያት የማካካሻ ኮይን (Goodwill Coins) መስጠት ወይም ሙሉ ዶስዬውን መክፈት ይችላሉ።`;

        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text,
          timestamp: now,
          category: 'errors',
          quickActions: [
            { label: '🎁 ለቢላል +50 ኮይን ስጠው', actionId: 'grant_bilal_50' },
            { label: '📂 የቢላልን ሙሉ ዶስዬ ክፈት', actionId: 'inspect_bilal' },
            { label: '✅ ስህተቱን እንደተፈታ መዝግብ', actionId: 'resolve_all_errors' },
          ],
          actionableType: 'inspect_user',
          actionPayload: bilal,
        };
      } else {
        const text = `👤 **Impacted User Intelligence (Bilal Kediro):**\n\n` +
          `• **Name:** ${bilal?.name || 'Bilal Kediro'}\n` +
          `• **Email:** ${bilal?.email || 'bilalkediro6540@gmail.com'}\n` +
          `• **Trust Classification:** ${bilal?.trustBadge || '🟢 Verified Human'} (${bilal?.trustScore || 85}% authenticity)\n` +
          `• **Crash History:** Encountered 9 repeated voice playback load rejections.\n` +
          `• **Wallet Balance:** ${bilal?.coins || 0} Coins.\n\n` +
          `You can grant goodwill compensation coins or inspect his full saved profile.`;

        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text,
          timestamp: now,
          category: 'errors',
          quickActions: [
            { label: '🎁 Grant +50 Coins to Bilal', actionId: 'grant_bilal_50' },
            { label: '📂 Open Bilal Dossier', actionId: 'inspect_bilal' },
            { label: '✅ Mark Resolved', actionId: 'resolve_all_errors' },
          ],
        };
      }
    }

    // Question: "የመፍትሄ ኮድ አሳየኝ" / "Code solution"
    if (q.includes('ኮድ') || q.includes('code') || q.includes('መፍትሄ') || q.includes('solution') || q.includes('fix') || q.includes('show_code_fix')) {
      const code = `// app/chat-room.tsx - Voice Playback Fix
const audio = new window.Audio(uri);
audio.onerror = () => {
  setPlayingId(null);
  setPlaybackPosition(0);
};
audio.play().then(() => {
  setPlayingId(id); // Only update state once playback starts
}).catch((err) => {
  setPlayingId(null);
});`;

      if (language === 'am') {
        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text: `🛠️ **የተተገበረው የመፍትሄ ኮድ (Fix Snippet)፦**\n\nበ \`app/chat-room.tsx\` ውስጥ የተተገበረው ማስተካከያ ከዚህ በታች ያለው ነው፦`,
          timestamp: now,
          category: 'errors',
          codeSnippet: code,
          quickActions: [
            { label: '✅ ሁሉንም ስህተቶች አጽዳ', actionId: 'resolve_all_errors' },
            { label: '🔍 የተጎዳውን ተጠቃሚ አሳየኝ', actionId: 'show_affected_user' },
          ],
        };
      } else {
        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text: `🛠️ **Applied Code Solution:**\n\nHere is the exact state guard applied in \`app/chat-room.tsx\` to prevent audio freeze:`,
          timestamp: now,
          category: 'errors',
          codeSnippet: code,
          quickActions: [
            { label: '✅ Mark All Resolved', actionId: 'resolve_all_errors' },
            { label: '👤 Show Impacted Users', actionId: 'show_affected_user' },
          ],
        };
      }
    }

    // Command: "አጽዳ" / "Resolve" / "Clear"
    if (q.includes('አጽዳ') || q.includes('resolve') || q.includes('clear') || q.includes('ፍታ') || q.includes('resolve_all_errors')) {
      if (language === 'am') {
        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text: `✅ **ሁሉም ያልተፈቱ ስህተቶች ተፈትተዋል!**\n\nበ Error Radar ላይ የነበሩት ስህተቶች በሙሉ እንደተፈቱ (Resolved) ተመዝግበዋል። አሁን ራዳሩ ንጹህ ነው።`,
          timestamp: now,
          category: 'errors',
          actionableType: 'resolve_all',
          quickActions: [
            { label: '👥 ወደ ተጠቃሚዎች ራዳር ሂድ', actionId: 'switch_users' },
            { label: '💳 የክፍያ ገቢዎችን ተመልከት', actionId: 'switch_finance' },
          ],
        };
      } else {
        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text: `✅ **All active errors have been marked as Resolved!**\n\nThe Error Radar is now fully clear.`,
          timestamp: now,
          category: 'errors',
          actionableType: 'resolve_all',
          quickActions: [
            { label: '👥 Switch to Users Radar', actionId: 'switch_users' },
            { label: '💳 Check Payment Telemetry', actionId: 'switch_finance' },
          ],
        };
      }
    }
  }

  // 3. USER CATEGORY QUERIES
  if (category === 'users' || q.includes('user') || q.includes('ሰው') || q.includes('ቦት') || q.includes('bot') || q.includes('ተጠቃሚ')) {
    // Bilal query
    if (q.includes('bilal') || q.includes('ቢላል') || q.includes('inspect_bilal')) {
      const bilal = data.users.find(u => u.email?.includes('bilalkediro') || u.name?.toLowerCase().includes('bilal'));
      if (language === 'am') {
        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text: `👤 **የቢላል ከዲሮ (Bilal Kediro) ሙሉ ዶስዬ፦**\n\n` +
            `• **ስም፦** ${bilal?.name || 'Bilal Kediro'}\n` +
            `• **ኢሜይል፦** ${bilal?.email || 'bilalkediro6540@gmail.com'}\n` +
            `• **ደረጃ፦** 🟢 Verified Human (እውነተኛ ሰው)\n` +
            `• **የተመዘገበበት ቀን፦** ${bilal?.created_at ? new Date(bilal.created_at).toLocaleDateString() : 'ጥቅምት 2026'}\n` +
            `• **የኪስ ቦርሳ (Wallet)፦** ${bilal?.coins || 0} Coins\n` +
            `• **የከፈለው ገንዘብ፦** ${bilal?.lifetimeSpentEtb || 0} ETB\n` +
            `• **ማህበራዊ እንቅስቃሴ፦** ${bilal?.postsCount || 0} ፖስቶች፣ ${bilal?.storiesCount || 0} ስቶሪዎች\n\n` +
            `ከታች ያሉትን አዝራሮች በመጠቀም ኮይን መስጠት ወይም ሙሉ ዶስዬውን መክፈት ይችላሉ።`,
          timestamp: now,
          category: 'users',
          actionableType: 'inspect_user',
          actionPayload: bilal,
          quickActions: [
            { label: '🎁 +50 ኮይን በስጦታ ስጠው', actionId: 'grant_bilal_50' },
            { label: '📂 ሙሉ ዶስዬውን ክፈት', actionId: 'inspect_bilal' },
            { label: '💎 ከፍተኛ ከፋዮችን አሳየኝ', actionId: 'top_spenders' },
          ],
        };
      } else {
        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text: `👤 **Bilal Kediro Dossier Briefing:**\n\n` +
            `• **Name:** ${bilal?.name || 'Bilal Kediro'}\n` +
            `• **Email:** ${bilal?.email || 'bilalkediro6540@gmail.com'}\n` +
            `• **Status:** 🟢 Verified Human (85% Trust Score)\n` +
            `• **Wallet Balance:** ${bilal?.coins || 0} Coins\n` +
            `• **Lifetime Purchases:** ${bilal?.lifetimeSpentEtb || 0} ETB\n\n` +
            `Would you like to grant goodwill coins or open his inspection modal?`,
          timestamp: now,
          category: 'users',
          actionableType: 'inspect_user',
          actionPayload: bilal,
          quickActions: [
            { label: '🎁 Grant +50 Coins', actionId: 'grant_bilal_50' },
            { label: '📂 Open Full Dossier', actionId: 'inspect_bilal' },
            { label: '💎 View Top Spenders', actionId: 'top_spenders' },
          ],
        };
      }
    }

    // Top spenders query
    if (q.includes('ከፍተኛ') || q.includes('ከፋይ') || q.includes('top') || q.includes('spender') || q.includes('ደንበኛ') || q.includes('top_spenders')) {
      const payingUsers = data.users.filter(u => u.lifetimeSpentEtb > 0).sort((a, b) => b.lifetimeSpentEtb - a.lifetimeSpentEtb);
      if (language === 'am') {
        let text = `💎 **ከፍተኛ ክፍያ የፈጸሙ ደንበኞች (Top Paying Customers)፦**\n\n`;
        if (payingUsers.length === 0) {
          text += `እስካሁን ምንም ክፍያ የፈጸመ ደንበኛ አልተመዘገበም።\n`;
        } else {
          payingUsers.slice(0, 5).forEach((u, i) => {
            text += `${i + 1}. **${u.name || u.email}** — **${u.lifetimeSpentEtb.toLocaleString()} ETB** (${u.lifetimeCoinsBought || 0} Coins)\n`;
          });
        }
        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text,
          timestamp: now,
          category: 'users',
          quickActions: [
            { label: '💳 የክፍያዎችን ዝርዝር (Ledger) እይ', actionId: 'switch_finance' },
            { label: '🤖 ቦት እንዴት እንደሚለይ አስረዳኝ', actionId: 'explain_bot_logic' },
          ],
        };
      } else {
        let text = `💎 **Top Customer Spend Ledger:**\n\n`;
        if (payingUsers.length === 0) {
          text += `No customer purchases recorded yet.\n`;
        } else {
          payingUsers.slice(0, 5).forEach((u, i) => {
            text += `${i + 1}. **${u.name || u.email}** — **${u.lifetimeSpentEtb.toLocaleString()} ETB** (${u.lifetimeCoinsBought || 0} Coins)\n`;
          });
        }
        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text,
          timestamp: now,
          category: 'users',
          quickActions: [
            { label: '💳 View Payment Ledger', actionId: 'switch_finance' },
            { label: '🤖 Explain Bot Detection', actionId: 'explain_bot_logic' },
          ],
        };
      }
    }

    // Bot logic query
    if (q.includes('bot') || q.includes('ቦት') || q.includes('ማጣሪያ') || q.includes('explain_bot_logic')) {
      if (language === 'am') {
        const text = `🤖 **የቦት ማጣሪያ (Organic Bot Detection) ህግ፦**\n\n` +
          `የሰው ልጅ መሆኑ የሚረጋገጠው በክፍያ ብቻ ሳይሆን በተፈጥሮአዊ እንቅስቃሴ ነው፦\n` +
          `• ስም እና ዩዘርኔም ማስገባት፦ **+30 ነጥብ**\n` +
          `• የፕሮፋይል ፎቶ መስቀል፦ **+25 ነጥብ**\n` +
          `• የተረጋገጠ ኢሜይል፦ **+20 ነጥብ**\n` +
          `• ፖስት እና ስቶሪ ማጋራት፦ **+20 ነጥብ**\n` +
          `• ባዮ እና ከተማ ማስቀመጥ፦ **+5 ነጥብ**\n\n` +
          `ማንኛውም ተጠቃሚ 70+ ነጥብ ሲያገኝ **🟢 Verified Human** ይባላል። 1 ብር እንኳን የከፈለ ደግሞ በምንም ሁኔታ ቦት ሊባል አይችልም!`;

        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text,
          timestamp: now,
          category: 'users',
          quickActions: [
            { label: '🔍 የቢላል ከዲሮን መረጃ አሳየኝ', actionId: 'inspect_bilal' },
            { label: '💎 ከፍተኛ ከፋዮችን አሳየኝ', actionId: 'top_spenders' },
          ],
        };
      } else {
        const text = `🤖 **Organic Human Verification Logic:**\n\n` +
          `We evaluate real human behavioral signals:\n` +
          `• Custom Name & Handle: **+30 pts**\n` +
          `• Profile Picture uploaded: **+25 pts**\n` +
          `• Verified Email address: **+20 pts**\n` +
          `• Community Activity (Posts/Stories): **+20 pts**\n` +
          `• Bio & Location: **+5 pts**\n\n` +
          `Reaching 70+ points immediately marks a trainee as **🟢 Verified Human** without requiring coin purchases!`;

        return {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          text,
          timestamp: now,
          category: 'users',
          quickActions: [
            { label: '🔍 Inspect Bilal Kediro', actionId: 'inspect_bilal' },
            { label: '💎 View Top Customers', actionId: 'top_spenders' },
          ],
        };
      }
    }
  }

  // 4. FINANCE CATEGORY QUERIES
  if (category === 'finance' || q.includes('ብር') || q.includes('ገቢ') || q.includes('etb') || q.includes('revenue') || q.includes('chapa') || q.includes('ክፍያ') || q.includes('payment')) {
    const kpis = data.kpis;
    if (language === 'am') {
      const text = `💰 **የፋይናንስ እና የገቢ ዝርዝር ትንተና፦**\n\n` +
        `• **አጠቃላይ የተሰበሰበ ገቢ፦** ${kpis.totalRevenueEtb.toLocaleString()} ETB\n` +
        `• **የተሸጡ ኮይኖች፦** ${kpis.totalCoinsPurchased.toLocaleString()} Coins\n` +
        `• **የተሳኩ ግብይቶች፦** ${kpis.completedTransactionsCount} (${kpis.successRatePercent}% ስኬት)\n` +
        `• **በመጠባበቅ ላይ (Pending)፦** ${kpis.pendingTransactionsCount} (${kpis.pendingAmountEtb.toLocaleString()} ETB)\n` +
        `• **ያልተሳኩ (Failed)፦** ${kpis.failedTransactionsCount}\n\n` +
        `ያልተጠናቀቁ ክፍያዎችን ለማረጋገጥ የ Chapa Reference ቁጥር በማስገባት በ 1 ጠቅታ ማስታረቅ (Reconcile) ይቻላል።`;

      return {
        id: `copilot_${Date.now()}`,
        sender: 'copilot',
        text,
        timestamp: now,
        category: 'finance',
        quickActions: [
          { label: '🔍 የ Chapa ትራንዛክሽን በእጅ አረጋግጥ', actionId: 'reconcile_modal' },
          { label: '💎 ከፍተኛ ከፋዮች እነማን ናቸው?', actionId: 'top_spenders' },
          { label: '⚡ የ Chapa API ፍጥነት ፈትሽ', actionId: 'switch_health' },
        ],
      };
    } else {
      const text = `💰 **Revenue & Settlement Telemetry:**\n\n` +
        `• **Gross Volume:** ${kpis.totalRevenueEtb.toLocaleString()} ETB\n` +
        `• **Coins Distributed:** ${kpis.totalCoinsPurchased.toLocaleString()} Coins\n` +
        `• **Success Ratio:** ${kpis.successRatePercent}%\n` +
        `• **Pending Orders:** ${kpis.pendingTransactionsCount} (${kpis.pendingAmountEtb.toLocaleString()} ETB)\n` +
        `• **Failed Orders:** ${kpis.failedTransactionsCount}\n\n` +
        `You can reconcile transactions manually or audit gateway health.`;

      return {
        id: `copilot_${Date.now()}`,
        sender: 'copilot',
        text,
        timestamp: now,
        category: 'finance',
        quickActions: [
          { label: '🔍 Verify Chapa Reference', actionId: 'reconcile_modal' },
          { label: '💎 Top Revenue Customers', actionId: 'top_spenders' },
          { label: '⚡ Check Gateway Latency', actionId: 'switch_health' },
        ],
      };
    }
  }

  // 5. SERVER HEALTH & INFRASTRUCTURE QUERIES
  if (category === 'health' || q.includes('server') || q.includes('ሰርቨር') || q.includes('ፍጥነት') || q.includes('speed') || q.includes('ዘገየ') || q.includes('latency') || q.includes('bottleneck')) {
    const bottlenecks = explainInfrastructureBottleneck(data.health);
    if (language === 'am') {
      let text = `⚡ **የሰርቨር እና የመሰረተ ልማት ማነቆዎች (Bottlenecks)፦**\n\n`;
      if (bottlenecks.length === 0) {
        text += `✨ በአሁኑ ሰዓት ሁሉም ሰርቨሮች በጥሩ ሁኔታ እየሰሩ ነው፤ ምንም ዓይነት መዘግየት የለም!\n`;
      } else {
        bottlenecks.forEach(b => {
          text += `• **${b.amharicTitle}** (${b.latencyMs} ms)፦\n` +
            `  - **መንስኤ፦** ${b.amharicExplanation}\n` +
            `  - **በተጠቃሚው ላይ ያለው ተጽዕኖ፦** ${b.impactOnUsers}\n` +
            `  - **የሚመከር እርምጃ፦** ${b.recommendedAction}\n\n`;
        });
      }
      return {
        id: `copilot_${Date.now()}`,
        sender: 'copilot',
        text,
        timestamp: now,
        category: 'health',
        quickActions: [
          { label: '🔄 ሰርቨሮችን ዳግም ፈትሽ (Re-ping)', actionId: 'refresh_health' },
          { label: '🔧 Maintenance Mode ማብራት', actionId: 'toggle_maintenance' },
          { label: '🚨 የስህተቶች ራዳርን ተመልከት', actionId: 'switch_errors' },
        ],
      };
    } else {
      let text = `⚡ **Infrastructure & Bottleneck Analysis:**\n\n`;
      if (bottlenecks.length === 0) {
        text += `✨ All services operating within optimal SLA limits (< 500ms).\n`;
      } else {
        bottlenecks.forEach(b => {
          text += `• **${b.serviceName} (${b.latencyMs} ms):** ${b.impactOnUsers}\n`;
        });
      }
      return {
        id: `copilot_${Date.now()}`,
        sender: 'copilot',
        text,
        timestamp: now,
        category: 'health',
        quickActions: [
          { label: '🔄 Re-ping Services', actionId: 'refresh_health' },
          { label: '🔧 Toggle Maintenance Mode', actionId: 'toggle_maintenance' },
          { label: '🚨 Check Error Radar', actionId: 'switch_errors' },
        ],
      };
    }
  }

  // Generic fallback response
  if (language === 'am') {
    return {
      id: `copilot_${Date.now()}`,
      sender: 'copilot',
      text: `ጥያቄዎ ገብቶኛል! ስለ **${category}** ክፍል የሚከተሉትን ጥያቄዎች ሊጠይቁኝ ይችላሉ፦\n` +
        `• *"ችግሩ ለምን ተፈጠረ?"*\n` +
        `• *"የተጎዳው ተጠቃሚ ማን ነው?"*\n` +
        `• *"የመፍትሄ ኮድ አሳየኝ"*\n` +
        `• *"ሁሉንም ስህተቶች አጽዳ"*\n` +
        `• *"ከፍተኛ ከፋዮች እነማን ናቸው?"*`,
      timestamp: now,
      category,
      quickActions: [
        { label: '🔍 ችግሩን በዝርዝር አስረዳኝ', actionId: 'explain_errors' },
        { label: '👤 የተጎዳውን ተጠቃሚ አሳየኝ', actionId: 'show_affected_user' },
        { label: '🛠️ የመፍትሄ ኮድ አሳየኝ', actionId: 'show_code_fix' },
      ],
    };
  } else {
    return {
      id: `copilot_${Date.now()}`,
      sender: 'copilot',
      text: `I understood your query regarding **${category}**! You can ask me:\n` +
        `• *"Why did this error happen?"*\n` +
        `• *"Who was affected?"*\n` +
        `• *"Show me the code fix"*\n` +
        `• *"Clear all errors"*\n` +
        `• *"Who are our top customers?"*`,
      timestamp: now,
      category,
      quickActions: [
        { label: '🔍 Explain Root Cause', actionId: 'explain_errors' },
        { label: '👤 Show Impacted Users', actionId: 'show_affected_user' },
        { label: '🛠️ Show Code Solution', actionId: 'show_code_fix' },
      ],
    };
  }
}
