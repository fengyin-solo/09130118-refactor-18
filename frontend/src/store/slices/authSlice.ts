import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  isPending,
  isFulfilled,
  isRejected,
} from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { session } from '../../services/session';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const getPersistedToken = (): string | null => session.getToken();

const initialState: AuthState = {
  user: null,
  token: getPersistedToken(),
  isAuthenticated: !!getPersistedToken(),
  loading: false,
  error: null,
};

const errorMessage = (error: any, fallback: string): string =>
  error.response?.data?.detail || fallback;

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(username, password);
      const { access_token } = response.data;
      session.setToken(access_token);

      const userResponse = await authAPI.getCurrentUser();
      const user = userResponse.data;
      session.setUser(user);

      return { user, token: access_token };
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
  session.clear();
  return null;
});

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
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // login / register 共用同一套加载与失败分支
      .addMatcher(isPending(login, register), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(isFulfilled(login, register), (state) => {
        state.loading = false;
      })
      .addMatcher(isRejected(login, register), (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
