# Static site served by nginx, same layout as ../website.
FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Where the "Docs" and "Website" links point; set at build time.
ARG VITE_DOCS_URL
ENV VITE_DOCS_URL=$VITE_DOCS_URL
ARG VITE_WEBSITE_URL
ENV VITE_WEBSITE_URL=$VITE_WEBSITE_URL
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
