const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_authenticated');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.token}`;
        const retry = await fetch(`${API_URL}${path}`, { ...options, headers });
        if (!retry.ok) throw new Error(`API error: ${retry.status}`);
        const rJson = await retry.json();
        if (rJson && typeof rJson === 'object' && 'success' in rJson && 'data' in rJson) return rJson.data as T;
        return rJson;
      }
      // Don't auto-redirect — just throw, let the page handle it
      throw new Error('Session expired. Please refresh the page or re-login.');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || body.data?.message || `API error: ${res.status}`);
    }
    const json = await res.json();
    // Backend wraps all responses as { success, data, timestamp } — unwrap automatically
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }
    return json;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('admin_refresh_token') : null;
      if (!refreshToken) return false;
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      const data = (json && json.success && json.data) ? json.data : json;
      this.setToken(data.accessToken);
      if (data.refreshToken) localStorage.setItem('admin_refresh_token', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(path: string) { return this.request<T>(path); }
  post<T>(path: string, body?: unknown) { return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); }
  put<T>(path: string, body?: unknown) { return this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }); }
  patch<T>(path: string, body?: unknown) { return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }); }
  delete<T>(path: string) { return this.request<T>(path, { method: 'DELETE' }); }

  // Auth
  requestOtp(phone: string) { return this.post<{ message: string }>('/auth/otp/request', { phone }); }
  verifyOtp(phone: string, code: string) { return this.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/otp/verify', { phone, code }); }

  // Users
  getUsers(params?: string) { return this.get<any>(`/users${params ? `?${params}` : ''}`); }
  getUser(id: string) { return this.get<any>(`/users/${id}`); }
  getMe() { return this.get<any>('/users/me'); }
  updateUserAdmin(id: string, data: any) { return this.put<any>(`/users/${id}/admin`, data); }
  deleteUser(id: string) { return this.delete<any>(`/users/${id}`); }

  // Chats (admin)
  getChats(params?: string) { return this.get<any>(`/chat/admin/all${params ? `?${params}` : ''}`); }
  getChatMessages(chatId: string, params?: string) { return this.get<any>(`/chat/admin/${chatId}/messages${params ? `?${params}` : ''}`); }
  getIntimacy(userId: string) { return this.get<any>(`/chat/intimacy/${userId}`); }
  getIntimacies(params?: string) { return this.get<any>(`/chat/admin/intimacies${params ? `?${params}` : ''}`); }

  // Wallet
  getWalletBalance() { return this.get<any>('/wallet/balance'); }
  rechargeWallet(data: { targetUserId: string; amount: number; coinType: 'GIFT' | 'GAME'; description?: string }) {
    return this.post<any>('/wallet/recharge', data);
  }
  getTransactions(params?: string) { return this.get<any>(`/wallet/admin/transactions${params ? `?${params}` : ''}`); }
  getWallets(params?: string) { return this.get<any>(`/wallet/admin/wallets${params ? `?${params}` : ''}`); }

  // Withdrawals
  getWithdrawals(params?: string) { return this.get<any>(`/admin/withdrawals${params ? `?${params}` : ''}`); }
  approveWithdrawal(id: string) { return this.put<any>(`/admin/withdrawals/${id}/approve`); }
  rejectWithdrawal(id: string, adminNote?: string) { return this.put<any>(`/admin/withdrawals/${id}/reject`, { adminNote }); }

  // Fraud
  getFraudFlags(params?: string) { return this.get<any>(`/fraud/flags${params ? `?${params}` : ''}`); }
  getUserFraud(userId: string) { return this.get<any>(`/fraud/user/${userId}`); }
  resolveFraudFlag(flagId: string) { return this.put<any>(`/fraud/flags/${flagId}/resolve`); }

  // Gifts
  getGifts(params?: string) { return this.get<any>(`/admin/gifts${params ? `?${params}` : ''}`); }
  getGift(id: string) { return this.get<any>(`/admin/gifts/${id}`); }
  createGift(data: any) { return this.post<any>('/admin/gifts', data); }
  updateGift(id: string, data: any) { return this.patch<any>(`/admin/gifts/${id}`, data); }
  deleteGift(id: string) { return this.delete<any>(`/admin/gifts/${id}`); }
  getGiftAnalytics() { return this.get<any>('/admin/gifts/analytics/metrics'); }
  getGiftTimeline(params?: string) { return this.get<any>(`/admin/gifts/analytics/timeline${params ? `?${params}` : ''}`); }
  getTopGifts() { return this.get<any>('/admin/gifts/analytics/top'); }
  getTopGifters() { return this.get<any>('/admin/gifts/analytics/gifters/leaderboard'); }
  getTopHosts() { return this.get<any>('/admin/gifts/analytics/hosts/leaderboard'); }
  getGiftTrends() { return this.get<any>('/admin/gifts/analytics/trends'); }

  // Agency
  getAgency(id: string) { return this.get<any>(`/agency/${id}`); }
  banAgency(id: string) { return this.post<any>(`/agency/${id}/ban`); }
  unbanAgency(id: string) { return this.post<any>(`/agency/${id}/unban`); }
  reverseCommission(txId: string) { return this.post<any>(`/agency/reverse-commission/${txId}`); }

  // Host
  registerSuperstar(data: any) { return this.post<any>('/host/rewards/superstar/register', data); }
  processSuperstarSalaries() { return this.post<any>('/host/rewards/superstar/process-salaries'); }

  // Settings
  getSettings() { return this.get<any>('/admin/settings'); }
  getSetting(key: string) { return this.get<any>(`/admin/settings/${key}`); }
  updateSetting(key: string, value: string) { return this.put<any>(`/admin/settings/${key}`, { value }); }

  // Follow
  getUserFollowers(id: string) { return this.get<any>(`/users/${id}/followers`); }
  getUserFollowing(id: string) { return this.get<any>(`/users/${id}/following`); }

  // Referrals
  getReferralStats() { return this.get<any>('/referral/stats'); }
  getReferralHistory() { return this.get<any>('/referral/history'); }

  // Health
  getHealth() { return this.get<any>('/health'); }
}

export const api = new ApiClient();
export default api;
