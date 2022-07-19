import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface GalleryState {
  count: number;
}

const initialState = { count: 0 } as GalleryState;

export const uploadImage = createAsyncThunk('user/uploadFile', async (file, thunkAPI) => {
  const response = await fetch('http://localhost:3001/api/gallery', {
    method: 'POST',
    body: file,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response;
});

const counterSlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {},
  extraReducers: {}
});

// export const {} = counterSlice.actions;
export default counterSlice.reducer;
