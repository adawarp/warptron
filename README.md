# warptron

## Prerequisites

- wget
- node

## How to use on macOS

1. Install momo for macOS by `sh download-momo-for-mac.sh`
2. add `warp-key.json` to the root

sample for warp-key.json

```
{
  "email": "email@example.com",
  "password": "password",
  "roidId": "roid-id"
}
```

3. `npm i`
4. `npm start`
5. then open warp-operator and connect to your roidId

## How to use on rasbian

1. Install momo for rasbian by `sh download-momo.sh`
2. `npm i`
3. `npm start`

WARNING: add adawarp.service and adausb.service to `/etc/systemd/systems`. warp-key.json will automatically load from usb memory