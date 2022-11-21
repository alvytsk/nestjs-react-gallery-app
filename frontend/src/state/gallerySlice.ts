import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { GalleryItemDTO, UploadingItemDTO } from '~/types/gallery';
import api from './api';
import axios, { AxiosError, AxiosResponse } from 'axios';

interface GalleryState {
  count: number;
  jobId: string | number;
  uploading: UploadingItemDTO[];
  files: GalleryItemDTO[];
}

const initialState: GalleryState = {
  count: 0,
  uploading: [],
  files: [],
  jobId: 0
};

// export const uploadFiles = createAsyncThunk<undefined, File[], { rejectValue: string }>(
//   'gallery/uploadFiles',
//   async (files, thunkApi) => {
//     const onUploadProgress = (event) => {
//       const percentage = Math.round((100 * event.loaded) / event.total);
//       console.log(`${percentage}%`);
//     };

//     try {
//       Array.from(files).forEach(async (file) => {
//         // console.log(file);
//         api.get('gallery/getSignedUrl/' + file.name).then(async (res) => {
//           // console.log(response.data);
//           const hashedFilename = res.data.hashedFilename;

//           const config = {
//             headers: {
//               'Content-Type': 'application/octet-stream'
//             },
//             onUploadProgress
//           };
//           axios.put(res.data.url, file, config).then(async (res) => {
//             // console.log(res);

//             api
//               .get('gallery/uploaded/', {
//                 params: { hashedFilename, originalFilename: file.name, mimeType: file.type }
//               })
//               .then((res) => {
//                 console.log(res.data);
//                 return res.data;
//               });
//           });
//         });
//       });
//     } catch (err) {
//       return thunkApi.rejectWithValue('Error');
//     }
//   }
// );

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
      progress: 0
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
    console.log(`${percentage}%`);
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
  reducers: {
    setUploadingProgress(state, action: PayloadAction<{ id: string; progress: number }>) {
      const index = state.uploading.findIndex((el) => el.name === action.payload.id);

      if (index !== -1) {
        state.uploading[index].progress = action.payload.progress;
      }
    },
    resetUploadingFiles(state) {
      state.uploading = [];
    }
  },
  extraReducers: (builder) => {
    // builder.addCase(uploadImage.pending, (state) => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // builder.addCase(uploadFiles.fulfilled, (state, action: PayloadAction<any>) => {
    //   // state.files = [...state.files, ...action.payload];
    //   console.log('fulfilled', action.payload);
    //   state.jobId = action.payload;
    // });

    // builder.addCase(uploadImage.rejected, (state, { payload }) => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(getFiles.fulfilled, (state, action: PayloadAction<any>) => {
      state.files = action.payload.data;
    });

    builder.addCase(getUploadFileUrl.fulfilled, (state, action) => {
      console.log('getUploadFileUrl', action.payload);
      const index = state.uploading.findIndex((el) => el.name === action.payload.name);

      if (index === -1) {
        state.uploading.push(action.payload);
      }
    });

    builder.addCase(uploadFile.fulfilled, (state, action) => {
      console.log('uploadFile', action.payload);
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

export const { setUploadingProgress, resetUploadingFiles } = gallerySlice.actions;

// export const {} = counterSlice.actions;
export default gallerySlice.reducer;
