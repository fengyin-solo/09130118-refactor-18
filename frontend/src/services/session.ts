import { User } from '../types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * 本地登录态的唯一出入口。登录写入、登出/401 清理、请求携带与页面
 * 刷新后的恢复判断都走这里，避免各路径各写一遍 localStorage 规则。
 * 存储的 key 与数据格式保持不变，已留在本地的数据可继续读取。
 */
export const session = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  setUser: (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
