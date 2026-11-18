# Scripts

| Script       | Usage                                                        | Effect                                                                                                 |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `release.sh` | `./scripts/release.sh backend\|frontend patch\|minor\|major` | bumps the library version, dates the `## [Unreleased]` changelog section, commits, tags `<lib>-vX.Y.Z` |

After `release.sh`, `git push && git push --tags` triggers `.github/workflows/release.yml` (tests, build, publish).
