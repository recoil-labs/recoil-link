---
'@recoillink/sdk': patch
'@recoillink/cli': patch
---

Router-map key resolution for warp deploy configs was moved into the SDK as `resolveWarpDeployConfigRouterKeys` and reused by the CLI and infra warp checker.
