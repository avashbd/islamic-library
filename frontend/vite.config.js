import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: change "base" to "/<your-repo-name>/" before deploying to
// GitHub Pages (e.g. "/islamic-library/"). Keep it "/" if you use a
// custom domain or a username.github.io root repo.
export default defineConfig({
  plugins: [react()],
  base: "/islamic-library/",
});
