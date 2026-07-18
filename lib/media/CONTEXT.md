# Media Library

## Status

Implemented end to end for Bunny storage, catalog persistence, image
processing, privacy boundaries, resumable ingestion, owner review, and photo
curation. The owner admin manages Media Assets and Draft Photo Selections;
`/photos` and the homepage consume the active Published Photo Selection. The
retired static photo fallback is not part of v3, and private Originals remain
server-only.

The Media Library owns reusable files, their safe descriptive metadata, and
the selections that publish them across the personal site.

## Language

**Media Asset**:
A reusable file registered in the Media Library, together with its owned
metadata and storage references.
_Avoid_: Upload, file record

**Original**:
The private, full-quality source object from which public versions are made.
_Avoid_: Source file, master

**Upload Intent**:
A short-lived, owner-authorized reservation for registering one Original under
one opaque object key. It records transfer expectations before bytes move and
can expire without creating a ready Media Asset.
_Avoid_: Pending file, temporary upload

**Rendition**:
A public, delivery-ready version derived from an Original.
_Avoid_: Copy, thumbnail

**Display Metadata**:
The allowlisted location, capture, and camera details that may be shown to a
visitor. Raw embedded metadata is not Display Metadata.
_Avoid_: EXIF blob, raw metadata

**Capture Location**:
The private coordinates extracted from an Original. Capture Location is never
published directly.
_Avoid_: Public location, photo address

**Location Label**:
The owner-editable place name that may be included in Display Metadata.
_Avoid_: GPS, coordinates

**Focal Point**:
The owner-selected point of interest used when a Rendition must be cropped for
a presentation surface. It does not alter the Original.
_Avoid_: Crop, hotspot

**Alt Text Suggestion**:
An AI-generated bilingual candidate description. Since July 2026 a fresh
suggestion auto-applies as the approved Alt Text when none exists yet, so an
upload becomes publishable without a review step; the owner may edit or
regenerate at any time, and regeneration never overwrites approved text.
_Avoid_: Generated alt text, automatic alt text

**Alt Text**:
The approved Chinese and English visual descriptions required before a
Media Asset may join a Published Photo Selection. Approval is automatic on
first suggestion and explicit on any owner edit.
_Avoid_: Caption, Alt Text Suggestion

**Catalog State**:
Whether a Media Asset is active, Archived, or being purged. It records the
asset's standing in the catalog and is separate from Processing State, which
tracks derivation progress.
_Avoid_: Lifecycle, status

**Processing State**:
The durable progress of registering and deriving a Media Asset, including
Original verification, Rendition processing, readiness, retryable failure, and
repair required. It is separate from Catalog State.
_Avoid_: Lifecycle, upload status

**Archived Media Asset**:
A Media Asset hidden from normal library views and unavailable to new Photo
Selections while its files and metadata remain recoverable.
_Avoid_: Deleted asset, trashed file

**Purge**:
The irreversible removal of a Media Asset, including its Original, Renditions,
and catalog record.
_Avoid_: Delete, remove

**Photo Selection**:
An ordered set of Media Assets chosen for the public photos page. Membership
and order do not change the underlying Media Assets.
_Avoid_: Gallery, photo uploads

**Draft Photo Selection**:
The owner's editable Photo Selection. Its membership and order are not visible
to visitors until publication.
_Avoid_: Working gallery, unpublished photos

**Published Photo Selection**:
The immutable snapshot shown on the photos page and in homepage previews. It
captures membership, order, public Rendition references, Focal Points, Alt
Text, and Display Metadata, and changes only when the owner publishes a Draft
Photo Selection.
_Avoid_: Live gallery, active photos
