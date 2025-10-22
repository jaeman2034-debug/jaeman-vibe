import fetch from 'node-fetch';

const HOOK = process.env.SLACK_WEBHOOK_URL_ALERTS;

async function postToSlack(text) {
  if (!HOOK) return;
  
  try {
    await fetch(HOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } catch (e) {
    console.error('[slack-post]', e);
  }
}

// 자동 배정 완료 알림
export async function notifyAutoAssign({ clubId, suggestions, committed }) {
  try {
    const totalAssignments = Object.values(suggestions).flat().length;
    const totalFixtures = Object.keys(suggestions).length;
    
    let text = `🤖 *자동 배정 ${committed ? '완료' : '추천'}*\n`;
    text += `클럽: ${clubId}\n`;
    text += `경기 수: ${totalFixtures}\n`;
    text += `배정 수: ${totalAssignments}\n\n`;
    
    if (committed) {
      text += `✅ 배정이 저장되었습니다.\n\n`;
    } else {
      text += `📋 추천 결과입니다. '추천 적용' 버튼을 눌러 저장하세요.\n\n`;
    }
    
    // 경기별 배정 요약
    for (const [fixtureId, assignments] of Object.entries(suggestions)) {
      if (assignments.length === 0) continue;
      
      text += `*경기 ${fixtureId}*\n`;
      for (const assignment of assignments) {
        const roleName = assignment.role === 'referee' ? '주심' :
                        assignment.role === 'ar1' ? '부심1' :
                        assignment.role === 'ar2' ? '부심2' :
                        assignment.role === 'table' ? '기록원' :
                        assignment.role === 'umpire' ? '심판' : assignment.role;
        text += `• ${roleName}: ${assignment.uid} (점수: ${assignment.score})\n`;
      }
      text += `\n`;
    }
    
    await postToSlack(text);
  } catch (e) {
    console.error('[notify-auto-assign]', e);
  }
}

// 월별 수당 요약 알림
export async function notifyMonthlyPayouts({ clubId, year, month, summary }) {
  try {
    const { totalAmount, totalMatches, officials } = summary;
    
    let text = `💰 *${year}년 ${month}월 수당 정산 요약*\n`;
    text += `클럽: ${clubId}\n`;
    text += `심판 수: ${officials}명\n`;
    text += `총 경기: ${totalMatches}경기\n`;
    text += `총 수당: ₩${totalAmount.toLocaleString()}\n`;
    text += `평균 수당: ₩${Math.round(totalAmount / officials).toLocaleString()}\n\n`;
    
    // 상위 5명 심판
    const topOfficials = summary.summary
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    text += `*상위 심판 (수당 기준)*\n`;
    for (const official of topOfficials) {
      text += `• ${official.uid}: ₩${official.total.toLocaleString()} (${official.matches}경기)\n`;
    }
    
    await postToSlack(text);
  } catch (e) {
    console.error('[notify-monthly-payouts]', e);
  }
}

// 배정 충돌 알림
export async function notifyAssignmentConflict({ clubId, fixtureId, uid, conflicts }) {
  try {
    let text = `⚠️ *배정 충돌 감지*\n`;
    text += `클럽: ${clubId}\n`;
    text += `심판: ${uid}\n`;
    text += `경기: ${fixtureId}\n\n`;
    
    text += `*충돌하는 경기들*\n`;
    for (const conflict of conflicts) {
      text += `• ${conflict.fixtureId}: ${conflict.homeTeamId} vs ${conflict.awayTeamId}\n`;
      text += `  시간: ${new Date(conflict.startAt).toLocaleString('ko-KR')}\n`;
    }
    
    await postToSlack(text);
  } catch (e) {
    console.error('[notify-assignment-conflict]', e);
  }
}

// 가용성 부족 알림
export async function notifyAvailabilityShortage({ clubId, fixtureId, neededRoles, availableOfficials }) {
  try {
    let text = `🚨 *가용성 부족 경고*\n`;
    text += `클럽: ${clubId}\n`;
    text += `경기: ${fixtureId}\n`;
    text += `필요한 역할: ${neededRoles.join(', ')}\n`;
    text += `가용 심판: ${availableOfficials.length}명\n\n`;
    
    if (availableOfficials.length > 0) {
      text += `*가용 심판 목록*\n`;
      for (const official of availableOfficials) {
        text += `• ${official.uid} (${official.name || '이름 없음'})\n`;
      }
    } else {
      text += `❌ 해당 시간대에 가용한 심판이 없습니다.\n`;
    }
    
    await postToSlack(text);
  } catch (e) {
    console.error('[notify-availability-shortage]', e);
  }
}
