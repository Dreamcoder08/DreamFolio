/** The pages, themes and floors every theme-state spec reads under. */
import { THEME, type Theme } from "./state-model";

export const HOME = "/";
export const PROJECT_DETAIL = "/projects/digital-public-peru/";
export const PROJECTS_INDEX = "/projects/";

export const THEMES: readonly Theme[] = [THEME.DARK, THEME.LIGHT];

/** 1.4.11's non-text floor — also the focus clause for the ink ring on an accent fill. */
export const NON_TEXT_FLOOR = 3;
