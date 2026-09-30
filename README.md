# verapancaldilab.github.io

Website of **NetB(IO)² — Network Biology for Immuno-oncology**, Vera Pancaldi's lab at the
Cancer Research Center of Toulouse (CRCT), Toulouse, France. Built with Jekyll and served by GitHub Pages.

## Updating content

Most content lives in YAML files, so no HTML is needed for routine updates:

| What | File |
|------|------|
| Publications (set `highlight: true` to feature one on the Research page) | `_data/publications.yml` |
| Team members (photos go in `assets/images/team/`, 400×400 px) | `_data/team.yml` |
| Software | `_data/tools.yml` |
| Navigation, email, social links | `_config.yml` |

Pages: `index.html` (home), `research/`, `tools/`, `team/`, `contact/`.

## Running locally

```sh
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000.
