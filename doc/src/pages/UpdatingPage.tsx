import { Code } from '../components/Code';

export function UpdatingPage() {
  return (
    <article>
      <h1>Updating the libraries</h1>

      <h2 id="versioning">Versioning</h2>
      <p>
        Both libraries follow <strong>semantic versioning</strong> independently: <code>MAJOR</code>{' '}
        for breaking changes (or a migration that needs every application to upgrade),{' '}
        <code>MINOR</code> for features, <code>PATCH</code> for fixes. Every change is written in
        the library <code>CHANGELOG.md</code>.
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Backend</th>
            <th>Frontend</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Version source</td>
            <td>
              <code>backend_lib/innotrec_auth/__init__.py</code>
            </td>
            <td>
              <code>frontend_lib/package.json</code>
            </td>
          </tr>
          <tr>
            <td>Git tag</td>
            <td>
              <code>backend-vX.Y.Z</code>
            </td>
            <td>
              <code>frontend-vX.Y.Z</code>
            </td>
          </tr>
          <tr>
            <td>Published to</td>
            <td>GitHub release (wheel) + git tag install</td>
            <td>
              GitHub Packages (<code>npm.pkg.github.com</code>)
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="release">Release a new version</h2>
      <Code title="terminal">{`
./scripts/release.sh backend minor     # bump 1.0.0 -> 1.1.0, commit, tag backend-v1.1.0
./scripts/release.sh frontend patch    # bump, commit, tag frontend-v1.0.1
git push && git push --tags            # the "release" workflow tests, builds and publishes
`}</Code>

      <h2 id="upgrade">Upgrade an application</h2>
      <Code title="backend">{`
# requirements.txt: change the tag
innotrec-auth @ git+https://github.com/innotrec/innotrec-lib.git@backend-v1.1.0#subdirectory=backend_lib

pip install -r requirements.txt
python manage.py migrate        # applies the library migrations (shared tables)
pytest
`}</Code>
      <Code title="frontend">{`
npm install @innotrec/ui@^1.1.0     # or: npm update @innotrec/ui
npm test && npm run build
`}</Code>
      <p className="callout">
        Pin exact versions in applications and let Dependabot / Renovate open the upgrade pull
        requests: the tests of each application decide whether the upgrade is safe.
      </p>

      <h2 id="local">Try an unreleased version in an application</h2>
      <Code>{`
pip install -e ../innotrec-lib/backend_lib
npm install ../innotrec-lib/frontend_lib      # after npm run build -w @innotrec/ui
`}</Code>
    </article>
  );
}
