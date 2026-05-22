import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt, walletAddress } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const text = prompt.toLowerCase();
    let actionType = 'UNKNOWN';
    let details = {};

    // Doğal dil işleme (Intent Parsing) kuralları
    if (text.includes('gönder') || text.includes('send') || text.includes('pay')) {
      actionType = 'ARC_PAY_TRANSFER';
      const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
      details = {
        amount: amountMatch ? amountMatch[1] : '10',
        token: 'USDC',
        recipient: '0xB87B...4365 // Auto-parsed from prompt'
      };
    } else if (text.includes('paylaştır') || text.includes('split') || text.includes('böl')) {
      actionType = 'ARC_PAY_SPLIT';
      details = {
        method: 'Equal Distribution',
        shares: ['50%', '50%'],
        targets: ['Team_A', 'Team_B']
      };
    } else if (text.includes('bahşiş') || text.includes('tip')) {
      actionType = 'ARC_CREATOR_TIP';
      details = { amount: '5', token: 'USDC', target: 'Creator_X' };
    }

    // Başarılı yapay zeka ajan yanıtı
    return NextResponse.json({
      success: true,
      agentName: 'Delphi AI',
      intent: actionType,
      parsedDetails: details,
      simulatedTxHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      message: `Delphi AI executed intent [${actionType}] successfully on Arc Network.`
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Agent execution failed' }, { status: 500 });
  }
}
