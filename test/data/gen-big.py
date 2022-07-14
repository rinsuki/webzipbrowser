from zipfile import ZipFile
import zipfile

with ZipFile("zip64.5gb.zip", "w") as zf:
    with zf.open("5gb.bin", "w", force_zip64=True) as f:
        f.write(b"\0" * (5 * 1024 * 1024 * 1024))

with ZipFile("zip64.5gb.comp.zip", "w") as zf:
    zf.writestr("5gb.bin", "\0" * (5 * 1024 * 1024 * 1024), compress_type=zipfile.ZIP_DEFLATED, compresslevel=1)
