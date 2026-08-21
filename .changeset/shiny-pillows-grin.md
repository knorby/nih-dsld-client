---
"@knorby/nih-dsld-client": minor
---

**`label.get` now returns a `thumbnailUrl`.** The DSLD site shows thumbnail
JPEGs for products, but the API's own `thumbnail` field is returned empty —
the images live at a deterministic URL
(`https://api.ods.od.nih.gov/dsld/s3/pdf/thumbnails/{id}.jpg`). The client
now derives this URL from the label ID and the configured base URL and
attaches it as `thumbnailUrl` on the `Label` returned by
`client.label.get(id)`. The image may still 404 for labels without a stored
thumbnail.
