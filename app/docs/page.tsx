import type { Metadata } from "next";
import { DocsClient } from "./docs-client";

export const metadata: Metadata = {
  title: "Spectro Docs",
  description: "Learn how to use the Spectro Figma plugin to generate, preview, and export UI color palettes.",
};

export default function DocsPage() {
  return <DocsClient />;
}
