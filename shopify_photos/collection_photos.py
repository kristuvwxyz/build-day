#!/usr/bin/env python3
"""Download full-resolution photos for every product in a public Shopify collection.

Uses the storefront's public products.json feed, so no API key is needed.
The image URLs in that feed point at the original uploads, not resized
thumbnails.

Usage:
  python3 shopify_photos/collection_photos.py https://regalspritz.com/collections/full-list-onhand-1 [--out photos]
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

USER_AGENT = "Mozilla/5.0 (collection-photo-downloader)"


def fetch(url):
    for attempt in range(6):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 or e.code >= 500:
                time.sleep(2 ** attempt)
                continue
            raise
        except urllib.error.URLError:
            time.sleep(2 ** attempt)
    raise RuntimeError(f"failed to fetch {url}")


def collection_products(collection_url):
    parts = urllib.parse.urlparse(collection_url)
    base = f"{parts.scheme or 'https'}://{parts.netloc}{parts.path.rstrip('/')}"
    page = 1
    while True:
        data = json.loads(fetch(f"{base}/products.json?limit=250&page={page}"))
        products = data.get("products", [])
        if not products:
            return
        yield from products
        page += 1


def safe(name):
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("collection_url", help="e.g. https://store.com/collections/some-collection")
    parser.add_argument("--out", default="photos", help="output directory (default: photos)")
    args = parser.parse_args()

    handle = urllib.parse.urlparse(args.collection_url).path.rstrip("/").rsplit("/", 1)[-1]
    out_dir = os.path.join(args.out, safe(handle))
    os.makedirs(out_dir, exist_ok=True)

    products = list(collection_products(args.collection_url))
    if not products:
        sys.exit(f"no products found at {args.collection_url}")
    total = sum(len(p["images"]) for p in products)
    print(f"{len(products)} products, {total} photos")

    done = 0
    with open(os.path.join(out_dir, "manifest.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["product", "handle", "file", "width", "height", "source_url"])
        for p in products:
            for i, img in enumerate(p["images"], 1):
                src = img["src"]
                src = "https:" + src if src.startswith("//") else src
                ext = os.path.splitext(urllib.parse.urlparse(src).path)[1] or ".jpg"
                rel = os.path.join(safe(p["handle"]), f"{safe(p['handle'])}_{i:02d}{ext}")
                dest = os.path.join(out_dir, rel)
                if not os.path.exists(dest):
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    with open(dest + ".part", "wb") as img_file:
                        img_file.write(fetch(src))
                    os.replace(dest + ".part", dest)
                writer.writerow([p["title"], p["handle"], rel, img.get("width"), img.get("height"), src])
                done += 1
                print(f"\rdownloaded {done}/{total}", end="", flush=True)
    print(f"\ndone: photos saved in {out_dir}/")


if __name__ == "__main__":
    main()
