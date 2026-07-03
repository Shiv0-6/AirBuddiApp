import type { PayloadAction as ToolkitPayloadAction } from '@reduxjs/toolkit';

const toolkit = require(`${process.cwd()}/node_modules/@reduxjs/toolkit/dist/cjs/index.js`) as {
  configureStore: typeof import('@reduxjs/toolkit')['configureStore'];
  createSlice: typeof import('@reduxjs/toolkit')['createSlice'];
};

export const configureStore = toolkit.configureStore;
export const createSlice = toolkit.createSlice;
export type PayloadAction<T = unknown> = ToolkitPayloadAction<T>;