import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import service from '../../services/blueprintsService.js'

export const fetchByAuthor = createAsyncThunk('blueprints/fetchByAuthor', async (author) => {
  const items = await service.getByAuthor(author)
  return { author, items }
})

export const fetchBlueprint = createAsyncThunk(
  'blueprints/fetchBlueprint',
  async ({ author, name }) => {
    return await service.getByAuthorAndName(author, name)
  },
)

export const createBlueprint = createAsyncThunk('blueprints/createBlueprint', async (payload) => {
  return await service.create(payload)
})

const initialState = {
  byAuthor: {},
  current: null,
  lastAuthorQuery: null,
  status: 'idle',
  error: null,
  blueprintStatus: 'idle',
  blueprintError: null,
  createStatus: 'idle',
  createError: null,
}

const slice = createSlice({
  name: 'blueprints',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchByAuthor.pending, (s, a) => {
        s.status = 'loading'
        s.error = null
        s.lastAuthorQuery = a.meta.arg
      })
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.byAuthor[a.payload.author] = a.payload.items
      })
      .addCase(fetchByAuthor.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.error.message
      })
      .addCase(fetchBlueprint.pending, (s) => {
        s.blueprintStatus = 'loading'
        s.blueprintError = null
      })
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        s.blueprintStatus = 'succeeded'
        s.current = a.payload
      })
      .addCase(fetchBlueprint.rejected, (s, a) => {
        s.blueprintStatus = 'failed'
        s.blueprintError = a.error.message
      })
      .addCase(createBlueprint.pending, (s) => {
        s.createStatus = 'loading'
        s.createError = null
      })
      .addCase(createBlueprint.fulfilled, (s, a) => {
        s.createStatus = 'succeeded'
        const bp = a.payload
        if (s.byAuthor[bp.author]) s.byAuthor[bp.author].push(bp)
      })
      .addCase(createBlueprint.rejected, (s, a) => {
        s.createStatus = 'failed'
        s.createError = a.error.message
      })
  },
})

const selectByAuthor = (state) => state.blueprints.byAuthor

export const selectTopBlueprints = createSelector([selectByAuthor], (byAuthor) =>
  Object.values(byAuthor)
    .flat()
    .slice()
    .sort((a, b) => (b.points?.length || 0) - (a.points?.length || 0))
    .slice(0, 5),
)

export default slice.reducer
