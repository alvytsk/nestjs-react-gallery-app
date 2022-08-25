import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface GalleryState {
  count: number;
}

const initialState = { count: 0 } as GalleryState;

export const uploadImage = createAsyncThunk<undefined, File, { rejectValue: string }>(
  'user/uploadFile',
  async (file, thunkApi) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);

    // const response = await fetch('https://nestjs-gallery.herokuapp.com/api/user/upload', {
    const response = await fetch('http://localhost:3001/api/user/upload', {
      method: 'POST',
      body: formData
    });
    return response.json();
  }
);

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(uploadImage.pending, (state) => {
      console.log('pending');
    });

    builder.addCase(uploadImage.fulfilled, (state, { payload }) => {
      console.log('fulfilled');
    });

    builder.addCase(uploadImage.rejected, (state, { payload }) => {
      console.log('rejected');
    });
  }
});

// export const {} = counterSlice.actions;
export default gallerySlice.reducer;
