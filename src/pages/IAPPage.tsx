import type { IapProductListItem } from '@apps-in-toss/web-framework';
import { checkoutPayment, IAP } from '@apps-in-toss/web-framework';
import { useCallback, useState } from 'react';
import { ApiCard } from '../components/ApiCard';
import { type HistoryEntry, HistoryLog } from '../components/HistoryLog';
import { PageHeader } from '../components/PageHeader';
import { WorkflowStepper } from '../components/WorkflowStepper';

export function IAPPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [products, setProducts] = useState<IapProductListItem[]>([]);
  const [selectedSku, setSelectedSku] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [purchaseError, setPurchaseError] = useState('');
  const [eventLog, setEventLog] = useState<HistoryEntry[]>([]);

  const addLog = useCallback((status: 'success' | 'error', data?: unknown, error?: string) => {
    setEventLog((prev) => [{ timestamp: Date.now(), status, data, error }, ...prev].slice(0, 20));
  }, []);

  const handlePurchase = useCallback(
    (type: 'onetime' | 'subscription') => {
      if (!selectedSku) return;
      setPurchaseStatus('loading');
      const method =
        type === 'onetime' ? IAP.createOneTimePurchaseOrder : IAP.createSubscriptionPurchaseOrder;
      method({
        options: {
          sku: selectedSku,
          processProductGrant: async () => {
            addLog('success', { event: 'processProductGrant', sku: selectedSku });
            return true;
          },
        },
        onEvent: (event) => {
          setPurchaseStatus('success');
          addLog('success', event);
          // Auto-advance to order management after successful purchase
          setActiveStep(2);
        },
        onError: (error) => {
          setPurchaseStatus('error');
          setPurchaseError(String(error));
          addLog('error', undefined, String(error));
        },
      });
    },
    [selectedSku, addLog],
  );

  const handleReset = useCallback(() => {
    setActiveStep(0);
    setProducts([]);
    setSelectedSku('');
    setPurchaseStatus('idle');
    setPurchaseError('');
    setEventLog([]);
  }, []);

  const steps = [
    {
      title: '상품 조회',
      description: 'getProductItemList()로 상품 목록을 가져옵니다',
      content: (
        <div className="space-y-3 py-2">
          <ApiCard
            name="IAP.getProductItemList"
            description="상품 목록 조회"
            params={[]}
            execute={async () => {
              const result = await IAP.getProductItemList();
              const items: IapProductListItem[] = result?.products ?? [];
              setProducts(items);
              if (items.length > 0) setSelectedSku(items[0]?.sku ?? '');
              return result;
            }}
          />
          {products.length > 0 && (
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-500 mb-2 dark:text-gray-400">상품 선택</p>
              {products.map((p, i) => {
                const sku = p.sku ?? '';
                return (
                  <button
                    type="button"
                    key={`${p.sku ?? 'unknown'}-${i}`}
                    onClick={() => {
                      setSelectedSku(sku);
                      setActiveStep(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                      selectedSku === sku
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                        : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p.displayName ?? p.sku} — {p.displayAmount ?? '?'}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '구매',
      description: selectedSku
        ? `선택한 상품(${selectedSku})을 구매합니다`
        : '상품을 먼저 선택하세요',
      content: (
        <div className="space-y-3 py-2">
          {selectedSku ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              SKU: <span className="font-mono font-semibold">{selectedSku}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">상품을 먼저 선택하세요</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePurchase('onetime')}
              disabled={!selectedSku || purchaseStatus === 'loading'}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              일회성 구매
            </button>
            <button
              type="button"
              onClick={() => handlePurchase('subscription')}
              disabled={!selectedSku || purchaseStatus === 'loading'}
              className="flex-1 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50 transition-colors dark:bg-gray-400 dark:text-gray-900 dark:hover:bg-gray-500"
            >
              구독 구매
            </button>
          </div>
          {purchaseStatus === 'error' && (
            <p className="text-sm text-red-600 dark:text-red-400">{purchaseError}</p>
          )}
          {/* HistoryLog is the primary result source — shows all purchase events in order */}
          <HistoryLog entries={eventLog} />
        </div>
      ),
    },
    {
      title: '주문 관리',
      description: '미완료 주문 조회, 완료/환불 내역, 구독 정보',
      content: (
        <div className="space-y-3 py-2">
          <ApiCard
            name="IAP.getPendingOrders"
            description="미완료 주문 조회"
            params={[]}
            execute={async () => await IAP.getPendingOrders()}
          />
          <ApiCard
            name="IAP.getCompletedOrRefundedOrders"
            description="완료/환불 주문 조회"
            params={[]}
            execute={async () => await IAP.getCompletedOrRefundedOrders()}
          />
          <ApiCard
            name="IAP.getSubscriptionInfo"
            description="구독 정보 조회"
            params={[{ name: 'orderId', label: 'Order ID', placeholder: 'order-123' }]}
            execute={async (p) => await IAP.getSubscriptionInfo({ params: { orderId: p.orderId } })}
          />
          <ApiCard
            name="checkoutPayment"
            description="TossPay 결제"
            params={[{ name: 'payToken', label: 'Pay Token', placeholder: 'token-123' }]}
            execute={async (p) => await checkoutPayment({ params: { payToken: p.payToken } })}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="IAP" />
      <div className="p-4">
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            초기화
          </button>
        </div>
        <WorkflowStepper steps={steps} activeStep={activeStep} onStepClick={setActiveStep} />
      </div>
    </div>
  );
}
