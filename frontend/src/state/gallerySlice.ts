import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { GalleryItemDTO } from '~/types/gallery';

interface GalleryState {
  count: number;
  files: GalleryItemDTO[];
}

const initialState = { count: 0, files: [] } as GalleryState;

export const uploadImage = createAsyncThunk<undefined, File[], { rejectValue: string }>(
  'gallery/uploadFiles',
  async (files, thunkApi) => {
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append(`${i}-${files[i].lastModified}`, files[i]);
      }

      // const response = await fetch('https://nestjs-gallery.herokuapp.com/api/user/upload', {
      const response = await fetch('http://localhost:3001/api/gallery/upload', {
        method: 'POST',
        body: formData
      });
      return response.json();
    } catch (err) {
      return thunkApi.rejectWithValue('Error');
    }
  }
);

export const getImages = createAsyncThunk<undefined, undefined, { rejectValue: string }>(
  'gallery/getAllFiles',
  async (_, thunkApi) => {
    try {
      // const response = await fetch('https://nestjs-gallery.herokuapp.com/api/user/upload', {
      const response = await fetch('http://localhost:3001/api/gallery/getAll');
      return response.json();
    } catch (err) {
      return thunkApi.rejectWithValue('Error');
    }
  }
);

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // builder.addCase(uploadImage.pending, (state) => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(uploadImage.fulfilled, (state, action: PayloadAction<any>) => {
      state.files = [...state.files, ...action.payload];
    });

    // builder.addCase(uploadImage.rejected, (state, { payload }) => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(getImages.fulfilled, (state, action: PayloadAction<any>) => {
      state.files = action.payload.data;
    });
  }
});

// export const {} = counterSlice.actions;
export default gallerySlice.reducer;
