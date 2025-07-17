// app/lib/subscription.ts

import { getAuthUser } from './auth';

export interface SubscriptionPlan {
  planName: string;
  amount: number;
  priceId: string;
}

export const createSubscription = async (plan: SubscriptionPlan) => {
  const user = getAuthUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const res = await fetch("/api/pricing-plan-purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.userId,
      planName: plan.planName,
      amount: plan.amount,
      priceId: plan.priceId,
      email: user.userEmail,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to create subscription");
  }

  return data;
};

export const redirectToSubscriptionCheckout = (
  plan: SubscriptionPlan, 
  planId: string,
  router: any
) => {
  const user = getAuthUser();
  
  if (!user) {
    router.push("/lithira/Authform");
    return;
  }

  const url = `/kalana/subscription-checkout?priceId=${plan.priceId}&planName=${encodeURIComponent(plan.planName)}&userId=${user.userId}&planId=${planId}&email=${encodeURIComponent(user.userEmail)}`;
  
  router.push(url);
}; 