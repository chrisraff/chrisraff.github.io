source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins

# github-pages pulls in liquid 4.0.3 by default, which calls the removed
# Ruby taint API and crashes on Ruby 3.2+; 4.0.4 fixed this and still
# satisfies Jekyll 3.9's "~> 4.0" requirement
gem "liquid", ">= 4.0.4", "< 5.0"

# Ruby 3.0+ no longer bundles these by default, but the old Jekyll 3.9 (via
# github-pages) still expects them to be implicitly available
gem "webrick", "~> 1.8"
gem "csv"
gem "base64"
gem "bigdecimal"
