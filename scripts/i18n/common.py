"""Replacements shared by every hand-written page: language, partials and internal links."""
COMMON = [
    ('<html lang="en">', '<html lang="nl">'),
    ('<!-- @include header -->', '<!-- @include header-nl -->'),
    ('<!-- @include footer -->', '<!-- @include footer-nl -->'),
]
# internal links, most specific first (applied with plain replace)
LINKS = [
    ('href="/services/air-freight/"', 'href="/nl/diensten/luchtvracht/"'),
    ('href="/services/sea-freight/"', 'href="/nl/diensten/zeevracht/"'),
    ('href="/services/road-transport/"', 'href="/nl/diensten/wegtransport/"'),
    ('href="/services/special-projects/"', 'href="/nl/diensten/projecten/"'),
    ('href="/contact/#enquiry"', 'href="/nl/contact/#enquiry"'),
    ('href="/contact/"', 'href="/nl/contact/"'),
    ('href="/about/', 'href="/nl/over-ons/'),
    ('href="/tools/', 'href="/nl/tools/'),
    ('href="/resources/"', 'href="/nl/incoterms/"'),
    ('href="/resources/#', 'href="/nl/incoterms/#'),
]

def links_present(path, pairs):
    """only the link pairs that occur in the file (links are optional per page)"""
    s = open(path, encoding='utf-8').read()
    return [p for p in pairs if p[0] in s]
