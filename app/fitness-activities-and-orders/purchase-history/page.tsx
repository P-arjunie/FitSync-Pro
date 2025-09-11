/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/Components/Navbar';
import Footer from '@/Components/Footer_02';
import {
  ShoppingBag,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Package,
  CreditCard,
  TrendingUp,
  Filter,
  Search,
  ArrowLeft,
  Wallet,
  X,
  AlertCircle,
  RefreshCw,
  XCircle
} from 'lucide-react';

interface PurchaseItem {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentFor: string;
  itemType: string;
  itemDetails: any;
  createdAt: string;
  updatedAt: string;
  remainingTime?: { days: number; hours: number };
  canRefund: boolean;
  refundAmount: number;
  isActive: boolean;
  refundStatus: string;
  refundRequestedAt?: string;
  refundProcessedAt?: string;
  refundReason?: string;
}

interface WalletData {
  balance: number;
  currency: string;
  transactions: any[];
}

const PurchaseHistoryPage = () => {
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseItem[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPurchase, setCancelPurchase] = useState<PurchaseItem | null>(null);
  const [summary, setSummary] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");

    if (!id) {
      router.push('/member-system-management/Authform');
      return;
    }
    setUserId(id);
    setUserEmail(email || '');
    setUserName(name || '');
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        // Fetch purchase history
        const historyRes = await fetch(`/api/purchase-history?userId=${userId}`);
        const historyData = await historyRes.json();

        if (!historyRes.ok) {
          throw new Error(historyData.error || 'Failed to fetch purchase history');
        }

        setPurchaseHistory(historyData.purchaseHistory || []);
        setSummary(historyData.summary || {});

        // Fetch wallet data
        const walletRes = await fetch(`/api/wallet?userId=${userId}`);
        const walletData = await walletRes.json();

        if (walletRes.ok) {
          setWalletData(walletData.wallet);
          // If wallet modal is open, force it to close and reopen to refresh UI
          if (showWalletModal) {
            setShowWalletModal(false);
            setTimeout(() => setShowWalletModal(true), 0);
          }
        }

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const filteredPurchases = purchaseHistory.filter(purchase => {
    const title = purchase.itemDetails?.title || '';
    const itemType = purchase.itemType || '';
    const paymentId = purchase.paymentId || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paymentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = selectedFilter === 'all' ||
      (selectedFilter === 'store' && purchase.paymentFor === 'order') ||
      (selectedFilter === 'classes' && purchase.paymentFor === 'enrollment') ||
      (selectedFilter === 'subscriptions' && purchase.paymentFor === 'pricing-plan');

    return matchesSearch && matchesFilter;
  });

  // Helper to calculate remaining/renewal time
  const getRemainingTime = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'paid':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Store Purchase':
        return <ShoppingBag className="text-blue-500" size={20} />;
      case 'Class Enrollment':
        return <Package className="text-purple-500" size={20} />;
      case 'Monthly Plan':
        return <Calendar className="text-purple-500" size={20} />;
      case 'Subscription Plan':
        return <TrendingUp className="text-green-500" size={20} />;
      default:
        return <CreditCard className="text-gray-500" size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const handleRefundRequest = async () => {
    if (!selectedPurchase || !refundReason.trim()) return;

    setProcessingRefund(true);
    try {
      let res;

      if (selectedPurchase.paymentFor === 'order') {
        // Shop purchase - only send email to admin
        res = await fetch('/api/shop-refund-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            purchaseId: selectedPurchase.paymentId,
            amount: selectedPurchase.amount,
            reason: refundReason,
            userEmail,
            userName,
            itemTitle: selectedPurchase.itemDetails?.title,
            orderNumber: selectedPurchase.itemDetails?.orderNumber
          }),
        });
      } else {
        // Class enrollment or subscription - process refund and add to wallet
        res = await fetch('/api/refund-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            purchaseId: selectedPurchase.paymentId,
            purchaseType: selectedPurchase.itemType,
            amount: selectedPurchase.amount,
            reason: refundReason,
            userEmail,
            userName,
            itemTitle: selectedPurchase.itemDetails?.title
          }),
        });
      }

      const data = await res.json();

      if (res.ok) {
        if (selectedPurchase.paymentFor === 'order') {
          alert('Shop refund request sent successfully! Admin will review your request and contact you.');
        } else {
          // Show appropriate message based on email status
          if (data.emailError) {
            alert(`Refund processed successfully! $${selectedPurchase.refundAmount.toFixed(2)} added to your wallet. Note: Email notification failed, but your refund request has been recorded.`);
          } else {
            alert(`Refund request sent successfully! $${selectedPurchase.refundAmount.toFixed(2)} added to your wallet.`);
          }
        }
        window.location.reload();
      } else {
        alert(data.error || 'Failed to process refund request');
      }
    } catch (err) {
      alert('Failed to process refund request');
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleCancelSubscription = async (purchase: PurchaseItem, reason?: string) => {
    if (!purchase.itemDetails?.planName) return;

    setProcessingCancel(true);
    try {
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planName: purchase.itemDetails.planName,
          reason: reason || '',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Subscription cancelled successfully! It will remain active until the end of the current billing period.');
        window.location.reload();
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      alert('Failed to cancel subscription');
    } finally {
      setProcessingCancel(false);
      setShowCancelModal(false);
      setCancelReason('');
      setCancelPurchase(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your purchase history...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Add remaining/renewal time to each purchase
  const purchasesWithTime = filteredPurchases.map((purchase) => {
    if (purchase.paymentFor === 'enrollment' && purchase.itemDetails?.endDate) {
      return { ...purchase, remainingTime: getRemainingTime(purchase.itemDetails.endDate) };
    }
    if (purchase.paymentFor === 'pricing-plan' && purchase.itemDetails?.renewalDate) {
      return { ...purchase, remainingTime: getRemainingTime(purchase.itemDetails.renewalDate) };
    }
    return purchase;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <ShoppingBag className="text-red-500" size={50} />
              <h1 className="text-5xl font-bold text-white">
                Purchase <span className="text-red-500">History</span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Track all your fitness investments and subscription activities
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <ArrowLeft size={20} />
                Back to Profile
              </button>

              <button
                onClick={() => setShowWalletModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Wallet size={20} />
                My Wallet (${walletData?.balance.toFixed(2) || '0.00'})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">${summary.totalSpent?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="text-green-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Purchases</p>
                <p className="text-3xl font-bold text-gray-900">{summary.totalPurchases || 0}</p>
              </div>
              <ShoppingBag className="text-blue-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{summary.activeSubscriptions || 0}</p>
              </div>
              <TrendingUp className="text-purple-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Wallet Balance</p>
                <p className="text-3xl font-bold text-gray-900">${walletData?.balance !== undefined ? walletData.balance.toFixed(2) : '0.00'}</p>
              </div>
              <Wallet className="text-green-500" size={40} />
            </div>
          </div>

          {/* Currently Purchased Classes (names) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Currently Purchased Classes</p>
                <div className="text-gray-900 font-bold text-lg">
                  {(summary.activeClassNames && summary.activeClassNames.length > 0)
                    ? summary.activeClassNames.join(', ')
                    : (() => {
                        // fallback: compute from purchaseHistory
                        const names = purchaseHistory.filter(p => p.paymentFor === 'enrollment' && p.isActive && p.itemDetails?.className)
                          .map(p => p.itemDetails.className);
                        return names.length > 0 ? names.join(', ') : 'None';
                      })()
                  }
                </div>
              </div>
              <Package className="text-purple-500" size={40} />
            </div>
          </div>

          {/* Currently Active Subscriptions (names) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Currently Active Subscriptions</p>
                <div className="text-gray-900 font-bold text-lg">
                  {(summary.activeSubscriptionNames && summary.activeSubscriptionNames.length > 0)
                    ? summary.activeSubscriptionNames.join(', ')
                    : (() => {
                        // fallback: compute from purchaseHistory
                        const names = purchaseHistory.filter(p => p.paymentFor === 'pricing-plan' && p.isActive && p.itemDetails?.planName)
                          .map(p => p.itemDetails.planName);
                        return names.length > 0 ? names.join(', ') : 'None';
                      })()
                  }
                </div>
              </div>
              <TrendingUp className="text-green-500" size={40} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="text-gray-800" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Filter & Search</h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="search"
                placeholder="Search purchases, classes, or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 placeholder-gray-400 text-lg"
              />
            </div>

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 font-medium text-lg min-w-[200px]"
            >
              <option value="all">All Payments</option>
              <option value="store">Store Purchases</option>
              <option value="classes">Class Enrollments</option>
              <option value="subscriptions">Subscriptions</option>
            </select>
          </div>
        </div>

        {/* Purchase History List */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {filteredPurchases.length === 0 && !error && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <ShoppingBag className="text-gray-400 mx-auto mb-4" size={60} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No purchases found</h3>
              <p className="text-gray-500">Start your fitness journey by exploring our classes and products!</p>
            </div>
          )}

          {purchasesWithTime.map((purchase) => (
            <div key={purchase.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left side - Purchase details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getTypeIcon(purchase.itemType)}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {purchase.itemDetails?.title || 'Purchase'}
                      </h3>
                      <p className="text-gray-600">{purchase.itemType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-400" size={16} />
                      <span className="text-gray-600">
                        {formatDate(purchase.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard className="text-gray-400" size={16} />
                      <span className="text-gray-600 font-mono">
                        {purchase.paymentId ? `ID: ${purchase.paymentId.slice(-8)}` : 'N/A'}
                      </span>
                    </div>

                    {purchase.itemDetails?.orderNumber && (
                      <div className="flex items-center gap-2">
                        <Package className="text-gray-400" size={16} />
                        <span className="text-gray-600">
                          Order: {purchase.itemDetails.orderNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remaining time for class enrollments */}
                  {purchase.paymentFor === 'enrollment' && purchase.remainingTime && purchase.isActive && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Clock size={16} />
                        <span className="font-medium">
                          Remaining: {purchase.remainingTime.days} days, {purchase.remainingTime.hours} hours
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Remaining time for pricing plan subscriptions */}
                  {purchase.paymentFor === 'pricing-plan' && purchase.remainingTime && purchase.isActive && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <Clock size={16} />
                        <span className="font-medium">
                          Renewal in: {purchase.remainingTime.days} days, {purchase.remainingTime.hours} hours
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Refund status display */}
                  {purchase.refundStatus === 'requested' && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <Clock size={16} />
                        <span className="font-medium">
                          Refund Requested - Pending Admin Review
                        </span>
                      </div>
                      {purchase.refundRequestedAt && (
                        <p className="text-sm text-yellow-600 mt-1">
                          Requested: {new Date(purchase.refundRequestedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {purchase.refundStatus === 'refunded' && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={16} />
                        <span className="font-medium">
                          Refund Approved - ${purchase.refundAmount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      {purchase.refundProcessedAt && (
                        <p className="text-sm text-green-600 mt-1">
                          Processed: {new Date(purchase.refundProcessedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {purchase.refundStatus === 'denied' && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle size={16} />
                        <span className="font-medium">
                          Refund Denied
                        </span>
                      </div>
                      {purchase.refundProcessedAt && (
                        <p className="text-sm text-red-600 mt-1">
                          Denied: {new Date(purchase.refundProcessedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Refund eligibility - only show if no refund status */}
                  {purchase.refundStatus === 'none' && purchase.canRefund && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <RefreshCw size={16} />
                        <span className="font-medium">
                          Eligible for ${purchase.refundAmount.toFixed(2)} refund
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side - Amount, status, and actions */}
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${purchase.amount.toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-sm">{(purchase.currency || '').toUpperCase()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(purchase.status)}
                    <span className={`text-sm font-medium ${purchase.status.toLowerCase() === 'succeeded' || purchase.status.toLowerCase() === 'paid'
                      ? 'text-green-600'
                      : purchase.status.toLowerCase() === 'pending'
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                      }`}>
                      {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2">
                    {/* Shop purchases - email only */}

                    {/* Shop purchases - refunded status */}

                    {/* Shop purchases - denied status */}

                    {/* Class enrollments - refund to wallet */}
                    {purchase.paymentFor === 'enrollment' && purchase.canRefund && purchase.refundStatus === 'none' && (
                      <button
                        onClick={() => {
                          setSelectedPurchase(purchase);
                          setShowRefundModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 text-sm font-medium"
                      >
                        Request Refund (${purchase.refundAmount.toFixed(2)})
                      </button>
                    )}

                    {/* Class enrollments - refunded status */}
                    {purchase.paymentFor === 'enrollment' && purchase.refundStatus === 'refunded' && (
                      <button
                        disabled
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
                      >
                        Refunded (${purchase.refundAmount?.toFixed(2) || '0.00'})
                      </button>
                    )}

                    {/* Class enrollments - denied status */}
                    {purchase.paymentFor === 'enrollment' && purchase.refundStatus === 'denied' && (
                      <button
                        disabled
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
                      >
                        Refund Denied
                      </button>
                    )}

                    {/* Monthly plans - cancel subscription */}
                    {purchase.paymentFor === 'monthly-plan' && purchase.isActive && (
                      <button
                        onClick={() => handleCancelSubscription(purchase)}
                        disabled={processingCancel}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-300 text-sm font-medium disabled:opacity-50"
                      >
                        {processingCancel ? 'Cancelling...' : 'Cancel Subscription'}
                      </button>
                    )}

                    {/* Pricing plans - cancel subscription */}
                    {purchase.paymentFor === 'pricing-plan' && purchase.isActive && purchase.refundStatus === 'none' && (
                      <button
                        onClick={() => {
                          setCancelPurchase(purchase);
                          setShowCancelModal(true);
                        }}
                        disabled={processingCancel}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 text-sm font-medium disabled:opacity-50"
                      >
                        {processingCancel ? 'Cancelling...' : 'Cancel Subscription'}
                      </button>
                    )}
                    {/* Pricing plans - refunded status */}
                    {purchase.paymentFor === 'pricing-plan' && purchase.refundStatus === 'refunded' && (
                      <button
                        disabled
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
                      >
                        Refunded
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional details for store purchases */}
              {purchase.paymentFor === 'order' && (
                <div className="w-full flex justify-center">
                  <div style={{ display: "inline-flex" }} className="items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 text-yellow-700">
                    <AlertCircle size={16} />
                    <span className="font-medium">
                      Store purchases are non-refundable.
                    </span>
                  </div>
                </div>
              )}
              {purchase.paymentFor === 'order' && purchase.itemDetails?.items && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-3">Items Purchased:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {purchase.itemDetails.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Request Refund</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You&apos;re requesting a refund for: <strong>{selectedPurchase.itemDetails?.title}</strong>
              </p>

              {selectedPurchase.paymentFor === 'order' ? (
                <>
                  <p className="text-gray-600 mb-4">
                    Purchase amount: <strong className="text-orange-600">${selectedPurchase.amount.toFixed(2)}</strong>
                  </p>
                  <p className="text-sm text-orange-500 mb-4">
                    Shop purchases require manual review. Your request will be sent to admin for processing.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    Refund amount: <strong className="text-green-600">${selectedPurchase.refundAmount.toFixed(2)}</strong>
                  </p>
                  <p className="text-sm text-green-500 mb-4">
                    This amount will be added to your wallet balance.
                  </p>
                </>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for refund:
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please explain why you're requesting a refund..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundRequest}
                disabled={!refundReason.trim() || processingRefund}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processingRefund ? 'Processing...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">My Wallet</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <Wallet className="text-green-600" size={32} />
                <div>
                  <p className="text-sm text-green-600 font-medium">Current Balance</p>
                  <p className="text-3xl font-bold text-green-700">${walletData?.balance.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Transaction History</h4>
              {walletData?.transactions && walletData.transactions.length > 0 ? (
                <div className="space-y-3">
                  {walletData.transactions.map((transaction: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.type === 'refund' || transaction.type === 'credit'
                          ? 'text-green-600'
                          : 'text-red-600'
                          }`}>
                          {transaction.type === 'refund' || transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal for Pricing Plans */}
      {showCancelModal && cancelPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Cancel Subscription</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancelPurchase(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <label className="block mb-2 font-medium text-gray-700">Reason for cancellation</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="border p-2 rounded w-full mb-4"
              rows={3}
              placeholder="Please provide a reason for cancelling your subscription"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancelPurchase(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCancelSubscription(cancelPurchase, cancelReason)}
                disabled={processingCancel || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {processingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PurchaseHistoryPage; 