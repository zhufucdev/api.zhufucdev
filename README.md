# Steve's API

It's a general purpose REST API holding management
of all my binary releases for the apps to update and
verify

## Vercel

Designed as an edge function, it uses Vercel as provider

The bad news is that you can't run this in a local environment,
for some random reason which nobody gives a fuck

The project is rather simple however, and thus easy to debug
even in Vercel env. Just upload

### Edge Config

With edge config, project alias are easily set and read

Why do I need project alias?
Well, to make the setup more sophisticated

```
[Vercel](https://vercel.com) > Your project > Storage >
Connect store > Create New > Edge Config
```

A configuration looks like this

```json
{
  "me": "MotionEmulator"
}
```

Now `?product=me` will reproduce `MotionEmulator`