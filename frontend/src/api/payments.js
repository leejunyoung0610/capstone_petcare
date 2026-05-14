import apiClient from './client';

/** 소견 요청과 동일 바디로 결제 주문 생성 → 토스 SDK 에 넘길 값 */
export async function prepareTossPayment(data) {
  const response = await apiClient.post('/payments/toss/prepare', data);
  return response.data;
}

export async function confirmTossPayment({ paymentKey, orderId, amount }) {
  const response = await apiClient.post('/payments/toss/confirm', {
    paymentKey,
    orderId,
    amount: Number(amount),
  });
  return response.data;
}
