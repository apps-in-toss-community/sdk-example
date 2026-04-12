import { useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ApiCard } from '../components/ApiCard';
import { ResultView } from '../components/ResultView';
import {
  grantPromotionReward,
  grantPromotionRewardForGame,
  submitGameCenterLeaderBoardScore,
  getGameCenterGameProfile,
  openGameCenterLeaderboard,
  contactsViral,
} from '@apps-in-toss/web-framework';

function ContactsViralCard() {
  const [moduleId, setModuleId] = useState('test-module');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<unknown>(undefined);
  const [error, setError] = useState('');

  const handleExecute = useCallback(() => {
    setStatus('loading');
    contactsViral({
      options: { moduleId },
      onEvent: (event) => {
        setStatus('success');
        setResult(event);
      },
      onError: (err) => {
        setStatus('error');
        setError(String(err));
      },
    });
  }, [moduleId]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900 font-mono">contactsViral</h3>
      <p className="mt-0.5 text-xs text-gray-500">연락처 바이럴 공유</p>
      <label className="block py-1.5 mt-2">
        <span className="text-sm text-gray-700">Module ID</span>
        <input
          type="text"
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          placeholder="test-module"
          className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
      </label>
      <button
        type="button"
        onClick={handleExecute}
        disabled={status === 'loading'}
        className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        실행
      </button>
      <ResultView status={status} data={result} error={error} />
    </div>
  );
}

export function GamePage() {
  return (
    <div>
      <PageHeader title="Game" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="grantPromotionReward"
          description="프로모션 리워드 지급"
          params={[
            { name: 'promotionCode', label: 'Promotion Code', placeholder: 'PROMO_001', defaultValue: 'PROMO_001' },
            { name: 'amount', label: 'Amount', type: 'number', defaultValue: '100', parse: (v) => Number(v) },
          ]}
          execute={async (p) => await grantPromotionReward({ params: { promotionCode: p.promotionCode as string, amount: p.amount as number } })}
        />
        <ApiCard
          name="grantPromotionRewardForGame"
          description="게임 프로모션 리워드 지급"
          params={[
            { name: 'promotionCode', label: 'Promotion Code', placeholder: 'GAME_001', defaultValue: 'GAME_001' },
            { name: 'amount', label: 'Amount', type: 'number', defaultValue: '100', parse: (v) => Number(v) },
          ]}
          execute={async (p) => await grantPromotionRewardForGame({ params: { promotionCode: p.promotionCode as string, amount: p.amount as number } })}
        />
        <ApiCard
          name="submitGameCenterLeaderBoardScore"
          description="리더보드 점수 제출"
          params={[{ name: 'score', label: 'Score', placeholder: '1000', defaultValue: '1000' }]}
          execute={async (p) => await submitGameCenterLeaderBoardScore({ score: p.score as string })}
        />
        <ApiCard name="getGameCenterGameProfile" description="게임 프로필 조회" execute={async () => await getGameCenterGameProfile()} />
        <ApiCard name="openGameCenterLeaderboard" description="리더보드 열기" execute={async () => { await openGameCenterLeaderboard(); }} />
        <ContactsViralCard />
      </div>
    </div>
  );
}
