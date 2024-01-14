# Steve's API

It's a general purpose REST API holding management
of all my binary releases for the apps to update and
verify

## Vercel

Designed as an edge function, it uses Vercel as provider

Due to the limitations to a pure JavaScript project, however,
this is now officially a Next.js project, taking complexity to
new level.

To debug locally, run

```shell
pnpm dev
```

### Edge Config

With edge config, project alias are easily set and read

Why do I need project alias?
Well, to make the setup more sophisticated

```
[Vercel](https://vercel.com) > Your project > Storage >
Connect store > Create New > Edge Config
```

Meanwhile, a token is required when running 
local development server. A setup is as follows,
```shell
cat > .env.local << EOF
EDGE_CONFIG="URL to your config"
EOF
```

A configuration looks like this

```json
{
  "me": {
    "repo": {
      "github": "zhufucdev/MotionEmulator"
    },
    "matchArch": "app-(\\w*)-.*",
    "category": [
      "standalone"
    ]
  }
}
```

Now `?product=me` will reproduce `MotionEmulator`, and `&arch=arm64`
matches `app-arm64-*.`

## Providers

We have an abstraction layer of download sources called provider

### GitHub Provider

Repo in the [Edge Config](#edge-config) section is actually a shortcut
for GitHub repository identifier 

### TeamCity Provider

I use TeamCity as private CI, and you can do that too

