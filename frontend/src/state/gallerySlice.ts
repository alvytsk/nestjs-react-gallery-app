import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { GalleryFile } from '~/types/gallery';

interface GalleryState {
  count: number;
  files: GalleryFile[];
}

const initialState = { count: 0, files: [] } as GalleryState;

export const uploadImage = createAsyncThunk<undefined, File[], { rejectValue: string }>(
  'user/uploadFile',
  async (files, thunkApi) => {
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append(`${i}-${files[i].lastModified}`, files[i]);
      }

      // const response = await fetch('https://nestjs-gallery.herokuapp.com/api/user/upload', {
      const response = await fetch('http://localhost:3001/api/user/upload', {
        method: 'POST',
        body: formData
      });
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
    builder.addCase(uploadImage.pending, (state) => {
      console.log('pending');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder.addCase(uploadImage.fulfilled, (state, action: PayloadAction<any>) => {
      console.log('fulfilled');
      state.files = action.payload;
    });

    builder.addCase(uploadImage.rejected, (state, { payload }) => {
      console.log('rejected');
    });
  }
});

// export const {} = counterSlice.actions;
export default gallerySlice.reducer;
