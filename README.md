# Steve's API

It's a general purpose RESTful API holding management
of all my binary releases for the apps to update and
verify

## Vercel

Designed as a serverless API, it uses Vercel as provider.

To run this in a local development env:
```shell
mongod ... &

npm i -g vercel
vercel env add DB_URI development
```
