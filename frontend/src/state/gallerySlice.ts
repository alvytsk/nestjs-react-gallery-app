import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { GalleryItemDTO, UploadingItemDTO } from '~/types/gallery';
import api from './api';
import axios, { AxiosError, AxiosResponse } from 'axios';

interface GalleryState {
  count: number;
  uploading: UploadingItemDTO[];
  files: GalleryItemDTO[];
}

const initialState: GalleryState = {
  count: 0,
  uploading: [],
  files: []
};

export const getUploadFileUrl = createAsyncThunk<UploadingItemDTO, File, { rejectValue: string }>(
  'gallery/getUploadFileUrl',
  async (file, thunkApi) => {
    // console.log(file);
    const response = await api.get('gallery/getSignedUrl/' + file.name);

    const result: UploadingItemDTO = {
      status: 'uploading',
      url: response.data.url,
      name: file.name,
      hashedFilename: response.data.hashedFilename,
      progress: 0,
      jobId: null
    };

    return result;
  }
);

export const uploadFile = createAsyncThunk<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  { file: File; url: string },
  { rejectValue: string }
>('gallery/uploadFile', async ({ file, url }, thunkApi) => {
  const onUploadProgress = (event) => {
    const percentage = Math.round((100 * event.loaded) / event.total);
    thunkApi.dispatch(setUploadingProgress({ id: file.name, progress: percentage }));
  };

  try {
    const config = {
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      onUploadProgress
    };
    const response = await axios.put(url, file, config);
    return response.data;
  } catch (err) {
    return thunkApi.rejectWithValue('Error');
  }
});

export const uploadFileCompleted = createAsyncThunk<
  { filename: string; jobId: number },
  { hashedFilename: string; originalFilename: string; mimeType: string },
  { rejectValue: string }
>(
  'gallery/uploadFileCompleted',
  async ({ hashedFilename, originalFilename, mimeType }, thunkApi) => {
    try {
      const response = await api.get('gallery/uploaded/', {
        params: { hashedFilename, originalFilename, mimeType }
      });

      return {
        filename: originalFilename,
        jobId: response.data.jobId
      };
    } catch (err) {
      return thunkApi.rejectWithValue('Error');
    }
  }
);

export const getFiles = createAsyncThunk<undefined, undefined, { rejectValue: string }>(
  'gallery/getAllFiles',
  async (_, thunkApi) => {
    try {
      const response = await fetch('http://localhost:3001/api/gallery/getAll');
      return await response.json();
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

export const getUploadingStatus = createAsyncThunk<undefined, number, { rejectValue: string }>(
  'gallery/getUploadingStatus',
  async (jobId, thunkApi) => {
    try {
      // const response = await fetch('https://nestjs-gallery.herokuapp.com/api/user/upload', {
      const response = await fetch('http://localhost:3001/api/gallery/test/' + jobId);
      return await response.json();
    } catch (err) {
      return thunkApi.rejectWithValue('Error');
    }
  }
);

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {
    setUploadingProgress(state, action: PayloadAction<{ id: string; progress: number }>) {
      const index = state.uploading.findIndex((el) => el.name === action.payload.id);

      if (index !== -1) {
        state.uploading[index].progress = action.payload.progress;
      }
    },
    deleteFromUploading(state, action: PayloadAction<{ id: string }>) {
      const index = state.uploading.findIndex((el) => el.name === action.payload.id);

      if (index !== -1) {
        state.uploading.splice(index, 1);
      }
    },
    resetUploadingFiles(state) {
      state.uploading = [];
    }
  },
  extraReducers: (builder) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(getFiles.fulfilled, (state, action: PayloadAction<any>) => {
      state.files = action.payload.data;
    });

    builder.addCase(getUploadFileUrl.fulfilled, (state, action) => {
      const index = state.uploading.findIndex((el) => el.name === action.payload.name);

      if (index === -1) {
        state.uploading.push(action.payload);
      }
    });

    builder.addCase(uploadFile.fulfilled, (state, action) => {
      // console.log('uploadFile', action.payload);
    });

    builder.addCase(uploadFileCompleted.fulfilled, (state, action) => {
      const index = state.uploading.findIndex((el) => el.name === action.payload.filename);

      if (index !== -1) {
        state.uploading[index].status = 'thumbnail';
        state.uploading[index].jobId = action.payload.jobId;
      }
      // console.log('uploadFileCompleted', action.payload);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(deleteFile.fulfilled, (state, action: PayloadAction<any>) => {
      state.files = state.files.filter((obj) => obj._id !== action.payload.id);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(getUploadingStatus.fulfilled, (state, action: PayloadAction<any>) => {
      const { progress, data } = action.payload;

      console.log(action.payload);

      if (+progress === 100) {
        const index = state.uploading.findIndex((el) => el.name === data.originalName);
        if (index !== -1) {
          state.uploading.splice(index, 1);
        }

        state.files.push(data);
      }
    });
  }
});

export const { setUploadingProgress, resetUploadingFiles } = gallerySlice.actions;

export default gallerySlice.reducer;
