import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { GalleryItemDTO } from '~/types/gallery';
import api from './api';
import axios, { AxiosResponse } from 'axios';

interface GalleryState {
  count: number;
  jobId: string | number;
  files: GalleryItemDTO[];
}

const initialState = { count: 0, files: [], jobId: 0 } as GalleryState;

export const uploadFiles = createAsyncThunk<undefined, File[], { rejectValue: string }>(
  'gallery/uploadFiles',
  async (files, thunkApi) => {
    const onUploadProgress = (event) => {
      const percentage = Math.round((100 * event.loaded) / event.total);
      console.log(`${percentage}%`);
    };

    try {
      Array.from(files).forEach(async (file) => {
        let response = await api.get('gallery/getSignedUrl/' + file.name);

        console.log(response.data);
        const hashedFilename = response.data.hashedFilename;

        // const formData = new FormData();
        // formData.append('file', file);
        const config = {
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          onUploadProgress
        };
        const result = await axios.put(response.data.url, file, config);

        console.log(result);

        if (result.status === 200) {
          response = await api.get('gallery/uploaded/', {
            params: { hashedFilename, originalFilename: file.name }
          });
        }

        // const formData = new FormData();
        // const response = await fetch('https://nestjs-gallery.herokuapp.com/api/user/upload', {
        // const response = await fetch('http://localhost:3001/api/gallery/upload', {
        //   method: 'POST',
        //   body: formData
        // });
        // return response.json();
        // return await api.post('http://localhost:3001/api/gallery/upload', formData, {
        //   headers: {
        //     'Content-type': 'multipart/form-data'
        //   }
      });
    } catch (err) {
      return thunkApi.rejectWithValue('Error');
    }
  }
);

export const getFiles = createAsyncThunk<undefined, undefined, { rejectValue: string }>(
  'gallery/getAllFiles',
  async (_, thunkApi) => {
    try {
      // const response = await fetch('https://nestjs-gallery.herokuapp.com/api/user/upload', {
      const response = await fetch('http://localhost:3001/api/gallery/getAll');
      return await response.json();

      // return api.get('gallery/getAll');
    } catch (err) {
      return thunkApi.rejectWithValue('Error');
    }
  }
);

export const deleteFile = createAsyncThunk<undefined, string, { rejectValue: string }>(
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
    builder.addCase(uploadFiles.fulfilled, (state, action: PayloadAction<any>) => {
      // state.files = [...state.files, ...action.payload];
      state.jobId = action.payload;
    });

    // builder.addCase(uploadImage.rejected, (state, { payload }) => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(getFiles.fulfilled, (state, action: PayloadAction<any>) => {
      state.files = action.payload.data;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(deleteFile.fulfilled, (state, action: PayloadAction<any>) => {
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
