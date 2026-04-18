import {
  appLogin,
  appsInTossSignTossCert,
  getIsTossLoginIntegratedService,
  getUserKeyForGame,
} from '@apps-in-toss/web-framework';
import { ApiCard } from '../components/ApiCard';
import { PageHeader } from '../components/PageHeader';

export function AuthPage() {
  return (
    <div>
      <PageHeader title="Auth" />
      <div className="p-4 space-y-3">
        <ApiCard
          name="appLogin"
          description="앱 로그인, authorizationCode 반환"
          params={[]}
          execute={async () => await appLogin()}
        />
        <ApiCard
          name="getIsTossLoginIntegratedService"
          description="토스 로그인 연동 서비스 여부"
          params={[]}
          execute={async () => getIsTossLoginIntegratedService()}
        />
        <ApiCard
          name="getUserKeyForGame"
          description="게임용 유저 해시 키"
          params={[]}
          execute={async () => await getUserKeyForGame()}
        />
        <ApiCard
          name="appsInTossSignTossCert"
          description="토스 인증서 서명"
          params={[{ name: 'txId', label: 'txId', placeholder: 'transaction-id' }]}
          execute={async (p) => await appsInTossSignTossCert({ txId: p.txId })}
        />
      </div>
    </div>
  );
}
