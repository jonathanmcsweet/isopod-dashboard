# Package the built extension as the OCI image Podman Desktop installs. PD reads
# the extension from /extension/, so the manifest, icon, and built output all go
# there. `dist/` must already exist — run `pnpm build` before building this image
# (the release workflow does; `dist/` is gitignored so it is never committed).
#
# FROM scratch: the image only ships static files (JS/HTML/CSS + manifest). PD
# extracts them; nothing in here is ever executed, so it needs no base OS and is
# architecture-neutral.
FROM scratch

LABEL org.opencontainers.image.title="Isopod Dashboard" \
      org.opencontainers.image.description="Manage isopod AI-coding sandboxes: box list, IDE launch, and egress observability" \
      org.opencontainers.image.vendor="isopod" \
      org.opencontainers.image.source="https://github.com/jonathanmcsweet/isopod-dashboard" \
      org.opencontainers.image.licenses="Apache-2.0" \
      io.podman-desktop.api.version=">=1.10.0"

COPY package.json /extension/
COPY icon.png /extension/
COPY LICENSE /extension/
COPY README.md /extension/
COPY dist /extension/dist
