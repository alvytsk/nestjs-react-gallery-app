import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { GalleryItemDTO } from '~/types/gallery';

interface GalleryState {
  count: number;
  jobId: string | number;
  files: GalleryItemDTO[];
}

const initialState = { count: 0, files: [], jobId: 0 } as GalleryState;

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
      return await response.json();
    } catch (err) {
      return thunkApi.rejectWithValue('Error');
    }
  }
);

export const deleteImage = createAsyncThunk<undefined, string, { rejectValue: string }>(
  'gallery/deleteFile',
  async (id, thunkApi) => {
    try {
      const response = await fetch('http://localhost:3001/api/gallery/' + id, {
        method: 'DELETE'
      });

      return await response.json();
    } catch (err) {
      return thunkApi.rejectWithValue('Error');
    }
  }
);

export const getUploadingStatus = createAsyncThunk<
  undefined,
  string | number,
  { rejectValue: string }
>('gallery/getUploadingStatus', async (jobId, thunkApi) => {
  try {
    // const response = await fetch('https://nestjs-gallery.herokuapp.com/api/user/upload', {
    const response = await fetch('http://localhost:3001/api/gallery/test/' + jobId);
    return await response.json();
  } catch (err) {
    return thunkApi.rejectWithValue('Error');
  }
});

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // builder.addCase(uploadImage.pending, (state) => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(uploadImage.fulfilled, (state, action: PayloadAction<any>) => {
      // state.files = [...state.files, ...action.payload];
      state.jobId = action.payload;
    });

    // builder.addCase(uploadImage.rejected, (state, { payload }) => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(getImages.fulfilled, (state, action: PayloadAction<any>) => {
      state.files = action.payload.data;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(deleteImage.fulfilled, (state, action: PayloadAction<any>) => {
      state.files = state.files.filter((obj) => obj.id !== action.payload.id);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(getUploadingStatus.fulfilled, (state, action: PayloadAction<any>) => {
      const { progress } = action.payload;

      if (Number(progress) === 100) {
        state.jobId = 0;
        state.files = [...state.files, ...action.payload.files];
      }
    });
  }
});

// export const {} = counterSlice.actions;
export default gallerySlice.reducer;
