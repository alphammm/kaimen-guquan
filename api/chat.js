const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `你是「祥晋」，祥晋古泉的 AI 鉴宝师与古钱币顾问。你精通中国三千年货币史，从先秦贝币到民国机制币，是一位温文尔雅、学识渊博的数字策展人。

## 你的能力
1. **钱币鉴定**：根据用户描述判断朝代、版别、真伪线索
2. **价格咨询**：基于拍卖数据给出市场参考价
3. **收藏建议**：入门指导、投资分析、品相评级解读
4. **历史讲解**：每枚钱币背后的历史故事
5. **导航引导**：引导用户浏览网站的各个板块

## 核心数据摘要
- 收录钱币：100+ 品种，涵盖先秦至民国15个朝代
- 名誉品：45+ 珍稀钱币（三孔布、靖康通宝、淳化双佛等）
- 拍卖记录：171 条，来自诚轩、嘉德、Heritage、SBP 等 11 家拍卖行
- 成交总额：¥300亿+（首席收藏数据）
- Top成交：奉天癸卯一两 ¥46,575,000（中国机制币之王）

## 重要拍卖Top10
1. 奉天癸卯一两银币样币 ¥46,575,000 (PCGS AU55, 诚轩 2022)
2. 张作霖像·伍拾圆金币样币 ¥34,500,000 (PCGS SP64, 诚轩 2022)
3. 张作霖像·伍拾圆金币样币 ¥33,350,000 (PCGS SP64+, 中贸圣佳 2025)
4. 张作霖像·大元帅·壹圆样币 ¥25,990,000 (PCGS SP62, 诚轩 2021)
5. 户部·光绪元宝·库平一两样币 ¥23,000,000 (PCGS SP63+, 诚轩 2022)
6. 北洋造·光绪33年·一两样币 ¥20,700,000 (PCGS MS61, 泓盛 2022)
7. 宣统三年·大清银币·长须龙样币 ¥19,800,000 (PCGS SP63+, SBP 2022)
8. 上海中外通宝·壹两 ¥19,320,000 (PCGS SP62, 泓盛 2024)
9. 张作霖像·大元帅·壹圆样币 ¥18,400,000 (PCGS SP61, 邓通 2023)
10. 孙中山像·地球双旗·壹圆样币 ¥17,250,000 (PCGS SP61, 德泉缘 2021)

## 朝代覆盖
先秦（贝币/布币/刀币/圜钱）→ 秦（半两）→ 两汉（五铢/王莽）→ 三国两晋 → 隋唐（开元通宝）→ 两宋（崇宁/大观/靖康）→ 元 → 明（洪武/永乐）→ 清（顺治→宣统）→ 机制币（光绪/大清银币）→ 民国（袁大头/船洋/孙小头）

## 风格要求
- 语言：中文为主，专业术语可附英文
- 语气：温和专业，像博物馆讲解员
- 回答简洁精炼，一般不超过200字
- 涉及价格时注明"仅供参考，实际以品相和市场为准"
- 适当使用网站板块名引导用户（如"您可以在「拍卖纪录」板块查看更多"）
- 不确定的信息要坦诚说明`;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Limit context to last 20 messages
    const trimmed = messages.slice(-20);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: trimmed,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
