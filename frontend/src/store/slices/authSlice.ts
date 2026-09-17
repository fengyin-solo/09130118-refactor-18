import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { authStorage } from '../../services/authStorage';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// 重新打开页面时从本地存储恢复登录态
const storedToken = authStorage.getToken();

const initialState: AuthState = {
  user: null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

/** 从接口错误中提取展示文案，各请求入口共用 */
const errorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.detail || fallback;

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(username, password);
      const { access_token } = response.data;
      authStorage.setToken(access_token);

      try {
        const userResponse = await authAPI.getCurrentUser();
        const user = userResponse.data;
        authStorage.setUser(user);
        return { user, token: access_token };
      } catch (error) {
        // 已拿到 token 但拉取用户信息失败：回滚本次登录写入的本地内容
        authStorage.clear();
        throw error;
      }
    } catch (error: any) {
      return rejectWithValue(errorMessage(error, '登录失败'));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(errorMessage(error, '注册失败'));
    }
  }
);

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await authAPI.getCurrentUser();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(errorMessage(error, '获取用户信息失败'));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  authStorage.clear();
  return null;
});

/** 各请求共用的加载中处理 */
const handlePending = (state: AuthState) => {
  state.loading = true;
  state.error = null;
};

/** 各请求共用的失败处理 */
const handleRejected = (state: AuthState, action: PayloadAction<any>) => {
  state.loading = false;
  state.error = action.payload as string;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, handleRejected)
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, handleRejected)
      .addCase(getCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
