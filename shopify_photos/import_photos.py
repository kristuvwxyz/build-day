#!/usr/bin/env python3
"""Download every photo from a Shopify store.

Pulls product images (organised by product handle) and every image in the
Content > Files library, using the Shopify Admin GraphQL API. Standard
library only, so no install step is needed.

Auth (set as environment variables):
  SHOPIFY_STORE          your-store.myshopify.com
  and either
  SHOPIFY_ACCESS_TOKEN   an Admin API access token (shpat_...)
  or
  SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET
                         a Dev Dashboard app installed on your own store;
                         a token is fetched with the client credentials grant.

The app needs the read_products and read_files scopes.

Usage:
  python3 shopify_photos/import_photos.py [--out photos] [--skip-files]
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2026-07")

PRODUCTS_QUERY = """
query($after: String) {
  products(first: 50, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      handle
      media(first: 250) {
        pageInfo { hasNextPage endCursor }
        nodes { ...img }
      }
    }
  }
}
fragment img on MediaImage { id image { url altText } }
"""

PRODUCT_MEDIA_QUERY = """
query($id: ID!, $after: String) {
  product(id: $id) {
    media(first: 250, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { ... on MediaImage { id image { url altText } } }
    }
  }
}
"""

FILES_QUERY = """
query($after: String) {
  files(first: 100, after: $after, query: "media_type:IMAGE") {
    pageInfo { hasNextPage endCursor }
    nodes { ... on MediaImage { id image { url altText } } }
  }
}
"""


def die(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def get_token(store):
    token = os.environ.get("SHOPIFY_ACCESS_TOKEN")
    if token:
        return token
    client_id = os.environ.get("SHOPIFY_CLIENT_ID")
    client_secret = os.environ.get("SHOPIFY_CLIENT_SECRET")
    if not (client_id and client_secret):
        die("set SHOPIFY_ACCESS_TOKEN, or SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET")
    body = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }).encode()
    req = urllib.request.Request(
        f"https://{store}/admin/oauth/access_token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)["access_token"]
    except urllib.error.HTTPError as e:
        die(f"token request failed ({e.code}): {e.read().decode(errors='replace')}")


class Client:
    def __init__(self, store, token):
        self.url = f"https://{store}/admin/api/{API_VERSION}/graphql.json"
        self.token = token

    def query(self, query, variables):
        payload = json.dumps({"query": query, "variables": variables}).encode()
        for attempt in range(8):
            req = urllib.request.Request(self.url, data=payload, headers={
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": self.token,
            })
            try:
                with urllib.request.urlopen(req) as resp:
                    data = json.load(resp)
            except urllib.error.HTTPError as e:
                if e.code == 429 or e.code >= 500:
                    time.sleep(2 ** attempt)
                    continue
                die(f"API request failed ({e.code}): {e.read().decode(errors='replace')}")
            errors = data.get("errors")
            if errors:
                if any(err.get("extensions", {}).get("code") == "THROTTLED" for err in errors):
                    time.sleep(2 ** attempt)
                    continue
                die(f"API error: {json.dumps(errors)}")
            return data["data"]
        die("gave up after repeated throttling")

    def paginate(self, query, path, variables=None):
        after = None
        while True:
            node = self.query(query, {**(variables or {}), "after": after})
            for key in path:
                node = node[key]
            yield from node["nodes"]
            if not node["pageInfo"]["hasNextPage"]:
                return
            after = node["pageInfo"]["endCursor"]


def filename_for(url, media_id):
    name = os.path.basename(urllib.parse.urlparse(url).path) or "image"
    stem, ext = os.path.splitext(name)
    short_id = media_id.rsplit("/", 1)[-1]
    return f"{re.sub(r'[^A-Za-z0-9._-]', '_', stem)}_{short_id}{ext or '.jpg'}"


def download(url, dest):
    if os.path.exists(dest):
        return False
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    tmp = dest + ".part"
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url) as resp, open(tmp, "wb") as f:
                while chunk := resp.read(1 << 16):
                    f.write(chunk)
            os.replace(tmp, dest)
            return True
        except (urllib.error.URLError, OSError):
            time.sleep(2 ** attempt)
    raise RuntimeError(f"failed to download {url}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", default="photos", help="output directory (default: photos)")
    parser.add_argument("--skip-files", action="store_true", help="only download product images")
    args = parser.parse_args()

    store = os.environ.get("SHOPIFY_STORE", "").removeprefix("https://").strip("/")
    if not store:
        die("set SHOPIFY_STORE, e.g. your-store.myshopify.com")
    client = Client(store, get_token(store))

    # Map media id -> (subdir, url, alt) so an image is only saved once.
    images = {}
    for product in client.paginate(PRODUCTS_QUERY, ["products"]):
        media = product["media"]
        nodes = media["nodes"]
        if media["pageInfo"]["hasNextPage"]:
            nodes = list(client.paginate(PRODUCT_MEDIA_QUERY, ["product", "media"], {"id": product["id"]}))
        for m in nodes:
            if m and m.get("image"):
                images[m["id"]] = (os.path.join("products", product["handle"]), m["image"]["url"], m["image"]["altText"])
        print(f"\rscanned products, {len(images)} images so far", end="", flush=True)
    print()

    if not args.skip_files:
        for m in client.paginate(FILES_QUERY, ["files"]):
            if m and m.get("image") and m["id"] not in images:
                images[m["id"]] = ("files", m["image"]["url"], m["image"]["altText"])
        print(f"found {len(images)} images including the Files library")

    os.makedirs(args.out, exist_ok=True)
    manifest_path = os.path.join(args.out, "manifest.csv")
    new = 0
    with open(manifest_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["media_id", "path", "alt_text", "source_url"])
        for i, (media_id, (subdir, url, alt)) in enumerate(images.items(), 1):
            rel = os.path.join(subdir, filename_for(url, media_id))
            new += download(url, os.path.join(args.out, rel))
            writer.writerow([media_id, rel, alt or "", url])
            print(f"\rdownloaded {i}/{len(images)}", end="", flush=True)
    print(f"\ndone: {len(images)} images in {args.out}/ ({new} new), manifest at {manifest_path}")


if __name__ == "__main__":
    main()
