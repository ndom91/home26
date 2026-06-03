---
description: Generate a cover image prompt for a blog post and append it to playground/cover-image-prompts.md
argument-hint: <blog-post-slug-or-path>
allowed-tools: Read, Edit, Glob
---

Generate a ChatGPT cover image prompt for the blog post: $ARGUMENTS

Steps:

1. Locate the post. `$ARGUMENTS` may be a slug (e.g. `protonmail-mbox`) or a path. Resolve it to `content/blog/<slug>/index.mdx` or `content/blog/<slug>.mdx` and read it. If it can't be found, list candidates under `content/blog/` and ask.

2. Read `playground/cover-image-prompts.md` to pick up the exact shared template used by every existing entry. Do not restyle or reword the boilerplate — every section ("The image should match this website style:", "Represent the subject as...", "Composition:", "Output:", "Negative prompt:") must be copied verbatim from the existing entries.

3. Write only two new pieces:
   - The `##` heading and the title inside the first line: use the post's frontmatter `title` exactly.
   - The "Main subject:" line: one sentence describing a single bold focal object that captures the post's topic. Match the register of existing entries — a simplified object/logo-inspired silhouette concept (e.g. "A Docker whale/container cube connected to a MySQL database cylinder via localhost loopback line."). Derive it from the post's actual content, not just the title. Avoid trademarked logos rendered exactly; "X-inspired" shapes are fine.

4. Append the new section to the end of `playground/cover-image-prompts.md`, matching the existing formatting (## heading, then a ```text fenced block).

5. Show the user the generated "Main subject:" line and remind them: paste the prompt into ChatGPT, save the result as `content/blog/<slug>/cover.png`.
