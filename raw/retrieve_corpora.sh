#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Download corpora
VIZNET_REPO_URL="http://viznet-repository.s3.amazonaws.com"
WEBTABLES_URL="http://data.dws.informatik.uni-mannheim.de/webtables/2015-07/relationalCorpus/compressed/"
wget --cut-dirs=0 -e robots=off "$VIZNET_REPO_URL/manyeyes.tar.gz"
wget --cut-dirs=0 -e robots=off "$VIZNET_REPO_URL/plotly.tar.gz"
wget --cut-dirs=0 -e robots=off "$VIZNET_REPO_URL/opendata.tar.gz"
wget -r -H --no-parent -nH --cut-dirs=0 -e robots=off "$WEBTABLES_URL"

# Unzip
tar zxvf *.tar.gz