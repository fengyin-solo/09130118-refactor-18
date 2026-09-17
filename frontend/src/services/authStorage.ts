import type { User } from '../types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * 登录态本地存储的唯一入口。
 * localStorage 的 key、读写格式、清理规则都收拢在这里，
 * 页面、slice、axios 拦截器一律通过它访问，改规则只改这一处。
 */
export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /** 清空本地登录态（登出、401、登录流程失败回滚共用） */
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
